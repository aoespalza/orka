import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService';
import { settingsRepository } from '../repositories/settingsRepository';

const prisma = new PrismaClient();

export interface ExpiryItem {
  id: string;
  code: string;
  title: string;
  supplierName: string;
  endDate: Date;
  daysUntilExpiration: number;
  finalValue?: number;
  totalValue?: number;
  status: string;
}

export interface NotificationResult {
  success: boolean;
  contractsFound: number;
  workOrdersFound: number;
  emailsSent: number;
  errors: string[];
}

class NotificationService {
  // Obtener días de vencimiento desde settings (default 7)
  private async getExpiryDays(): Promise<number> {
    try {
      const setting = await prisma.setting.findFirst({
        where: { key: 'NOTIFICATION_EXPIRY_DAYS' }
      });
      return setting ? parseInt(setting.value) : 7;
    } catch {
      return 7;
    }
  }

  // Obtener destinatarios para notificaciones - primero de settings, luego de usuarios DB
  private async getRecipients(): Promise<{ email: string; name: string }[]> {
    try {
      // 1. Buscar destinatarios configurados en settings (notification_email_*)
      const notificationSettings = await prisma.setting.findMany({
        where: { key: { startsWith: 'notification_email_' } }
      });
      
      if (notificationSettings.length > 0) {
        console.log(`[NotificationService] Usando ${notificationSettings.length} destinatarios de settings`);
        return notificationSettings.map(s => ({ 
          email: s.value, 
          name: s.value.split('@')[0] 
        }));
      }
      
      // 2. Si no hay destinatarios en settings, buscar usuarios activos
      console.log('[NotificationService] No hay destinatarios en settings, buscando usuarios...');
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'PURCHASE_MANAGER'] },
          isActive: true
        },
        select: { email: true, name: true }
      });
      
      return users
        .filter(u => u.email)
        .map(u => ({ email: u.email!, name: u.name || u.email!.split('@')[0] }));
    } catch (error) {
      console.error('[NotificationService] Error getting recipients:', error);
      return [];
    }
  }

  // Consultar contratos próximos a vencer (incluye los próximos a vencer y los ya vencidos)
  private async getExpiringContracts(days: number): Promise<ExpiryItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    // Buscar contratos con fecha fin desde hace 30 días hasta futuro
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 30); // Incluir los vencidos en los últimos 30 días

    const contracts = await prisma.contract.findMany({
      where: {
        endDate: {
          gte: pastDate,
          lte: futureDate
        },
        status: { in: ['ACTIVE', 'DRAFT', 'COMPLETED'] }
      },
      include: { supplier: true },
      orderBy: { endDate: 'asc' }
    });

    return contracts.map(c => ({
      id: c.id,
      code: c.code,
      title: `Contrato ${c.code}`,
      supplierName: c.supplier?.name || 'N/A',
      endDate: c.endDate!,
      daysUntilExpiration: Math.ceil((c.endDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      finalValue: c.finalValue,
      status: c.status
    }));
  }

  // Consultar órdenes de trabajo próximas a vencer (incluye los próximos a vencer y los ya vencidos)
  private async getExpiringWorkOrders(days: number): Promise<ExpiryItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    // Buscar OTs con fecha fin desde hace 30 días hasta futuro
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 30); // Incluir los vencidos en los últimos 30 días

    const workOrders = await prisma.workOrder.findMany({
      where: {
        endDate: {
          gte: pastDate,
          lte: futureDate
        },
        status: { in: ['APPROVED', 'IN_PROGRESS', 'DRAFT', 'COMPLETED'] }
      },
      include: { supplier: true },
      orderBy: { endDate: 'asc' }
    });

    return workOrders.map(wo => ({
      id: wo.id,
      code: wo.code,
      title: wo.title,
      supplierName: wo.supplier?.name || 'N/A',
      endDate: wo.endDate!,
      daysUntilExpiration: Math.ceil((wo.endDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      totalValue: wo.totalValue,
      status: wo.status
    }));
  }

  // Generar HTML del email
  private generateEmailHtml(
    contracts: ExpiryItem[],
    workOrders: ExpiryItem[],
    days: number
  ): string {
    const companyName = process.env.COMPANY_NAME || 'Orka Sistema';
    const today = new Date().toLocaleDateString('es-CL');

    let contractsHtml = '';
    if (contracts.length > 0) {
      contractsHtml = `
        <h3 style="color: #0A2540; margin-top: 20px;">📜 Contratos próximos a vencer (${contracts.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Código</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Proveedor</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fecha Fin</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Días</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Valor</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${contracts.map(c => `
              <tr style="${c.daysUntilExpiration <= 3 ? 'background-color: #ffebee;' : c.daysUntilExpiration <= 7 ? 'background-color:fff3e0;' : ''}">
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>${c.code}</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${c.supplierName}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(c.endDate).toLocaleDateString('es-CL')}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${c.daysUntilExpiration <= 3 ? '#d32f2f' : c.daysUntilExpiration <= 7 ? '#f57c00' : '#388e3c'}">${c.daysUntilExpiration}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${c.finalValue?.toLocaleString('es-CL') || '0'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${c.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let workOrdersHtml = '';
    if (workOrders.length > 0) {
      workOrdersHtml = `
        <h3 style="color: #0A2540; margin-top: 20px;">🔧 Órdenes de Trabajo próximas a vencer (${workOrders.length})</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Código</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Título</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Proveedor</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fecha Fin</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Días</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Valor</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${workOrders.map(wo => `
              <tr style="${wo.daysUntilExpiration <= 3 ? 'background-color: #ffebee;' : wo.daysUntilExpiration <= 7 ? 'background-color:fff3e0;' : ''}">
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>${wo.code}</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${wo.title}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${wo.supplierName}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(wo.endDate).toLocaleDateString('es-CL')}</th>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${wo.daysUntilExpiration <= 3 ? '#d32f2f' : wo.daysUntilExpiration <= 7 ? '#f57c00' : '#388e3c'}">${wo.daysUntilExpiration}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${wo.totalValue?.toLocaleString('es-CL') || '0'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${wo.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const noItems = contracts.length === 0 && workOrders.length === 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0A2540; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Recordatorio de Vencimientos</h1>
            <p>${companyName} - ${today}</p>
          </div>
          <div class="content">
            ${noItems ? `
              <p style="text-align: center; color: #388e3c; font-size: 16px;">
                ✅ No hay contratos ni órdenes de trabajo próximos a vencer en los próximos ${days} días.
              </p>
            ` : `
              <p>Se encontraron los siguientes elementos próximos a vencer en los próximos <strong>${days} días</strong>:</p>
              ${contractsHtml}
              ${workOrdersHtml}
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <strong>Leyenda de colores:</strong><br>
                🔴 Rojo: Vencimiento crítico (≤3 días)<br>
                🟡 Naranja: Advertencia (4-7 días)<br>
                🟢 Verde: OK (>7 días)
              </p>
            `}
          </div>
          <div class="footer">
            <p>Este es un mensaje automático generado por ${companyName}.</p>
            <p>Para modificar la configuración de notificaciones, contacte al administrador.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Enviar notificaciones de vencimiento
  async sendExpiryReminders(): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      contractsFound: 0,
      workOrdersFound: 0,
      emailsSent: 0,
      errors: []
    };

    try {
      // Verificar si SMTP está configurado
      const isConfigured = await emailService.isConfigured();
      if (!isConfigured) {
        result.errors.push('SMTP no configurado. Configure el servidor de email en Settings.');
        return result;
      }

      // Obtener configuración
      const days = await this.getExpiryDays();
      const recipients = await this.getRecipients();

      if (recipients.length === 0) {
        result.errors.push('No hay destinatarios configurados (ADMIN o PURCHASE_MANAGER)');
        return result;
      }

      // Consultar items próximos a vencer
      const contracts = await this.getExpiringContracts(days);
      const workOrders = await this.getExpiringWorkOrders(days);

      result.contractsFound = contracts.length;
      result.workOrdersFound = workOrders.length;

      // Si no hay nada que notificar, salir temprano
      if (contracts.length === 0 && workOrders.length === 0) {
        console.log(`[NotificationService] No hay items próximos a vencer en ${days} días`);
        result.success = true;
        return result;
      }

      // Generar HTML del email
      const html = this.generateEmailHtml(contracts, workOrders, days);
      const companyName = process.env.COMPANY_NAME || 'Orka Sistema';

      // Enviar a cada destinatario
      for (const recipient of recipients) {
        try {
          const emailResult = await emailService.send({
            to: recipient.email,
            subject: `🔔 Recordatorio: ${contracts.length + workOrders.length} items próximos a vencer - ${companyName}`,
            html
          });

          if (emailResult.success) {
            result.emailsSent++;
            console.log(`[NotificationService] Email enviado a ${recipient.email}`);
          } else {
            result.errors.push(`Error enviando a ${recipient.email}: ${emailResult.error}`);
          }
        } catch (error) {
          result.errors.push(`Excepción enviando a ${recipient.email}: ${String(error)}`);
        }
      }

      result.success = result.emailsSent > 0;

    } catch (error) {
      console.error('[NotificationService] Error general:', error);
      result.errors.push(String(error));
    }

    return result;
  }

  // Obtener preview sin enviar (para testing)
  async getPreview(days: number = 7): Promise<{ contracts: ExpiryItem[]; workOrders: ExpiryItem[] }> {
    const contracts = await this.getExpiringContracts(days);
    const workOrders = await this.getExpiringWorkOrders(days);
    return { contracts, workOrders };
  }
}

export const notificationService = new NotificationService();
export default notificationService;