import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { notificationService } from '../../../infrastructure/services/notificationService';
import { schedulerService } from '../../../infrastructure/services/schedulerService';

const router = Router();

// POST /api/notifications/send-expiry-reminders - Enviar recordatorios de vencimiento
const sendExpiryReminders = async (req: Request, res: Response) => {
  try {
    console.log('[NotificationRoutes] Enviando recordatorios de vencimiento...');
    const result = await notificationService.sendExpiryReminders();
    
    res.json({
      success: result.success,
      message: result.success 
        ? `Notificaciones enviadas: ${result.emailsSent} emails`
        : 'Error al enviar notificaciones',
      details: {
        contractsFound: result.contractsFound,
        workOrdersFound: result.workOrdersFound,
        emailsSent: result.emailsSent,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al enviar notificaciones',
      details: String(error)
    });
  }
};

// GET /api/notifications/preview - Ver preview sin enviar
const getPreview = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const preview = await notificationService.getPreview(days);
    const policies = await notificationService.getExpiringPolicies(30);
    
    res.json({
      days,
      contracts: preview.contracts,
      workOrders: preview.workOrders,
      policies: policies,
      total: preview.contracts.length + preview.workOrders.length + policies.length
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ error: String(error) });
  }
};

// GET /api/notifications/policies-preview - Ver preview de pólizas
const getPoliciesPreview = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const policies = await notificationService.getExpiringPolicies(days);
    
    res.json({
      days,
      policies,
      total: policies.length
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ error: String(error) });
  }
};

// GET /api/notifications/status - Ver estado de notificaciones y scheduler
const getStatus = async (req: Request, res: Response) => {
  try {
    const { emailService } = require('../../../infrastructure/services/emailService');
    const isEmailConfigured = await emailService.isConfigured();
    const schedulerStatus = schedulerService.getStatus();
    
    res.json({
      emailConfigured: isEmailConfigured,
      expiryDays: 7, // Default, se puede leer de settings
      scheduler: {
        isRunning: schedulerStatus.isRunning,
        lastRun: schedulerStatus.lastRun,
        schedule: schedulerStatus.schedule,
        nextRun: '8:00 AM daily' // Se puede calcular la próxima ejecución
      }
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ error: String(error) });
  }
};

// POST /api/notifications/trigger - Ejecutar scheduler manualmente
const triggerScheduler = async (req: Request, res: Response) => {
  try {
    console.log('[NotificationRoutes] Ejecutando scheduler manualmente...');
    const result = await schedulerService.triggerNow();
    
    res.json({
      success: true,
      message: 'Scheduler ejecutado manualmente',
      details: result
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al ejecutar scheduler',
      details: String(error)
    });
  }
};

// POST /api/notifications/policy-update - Notificar actualización de póliza por OtroSi
const notifyPolicyUpdate = async (req: Request, res: Response) => {
  try {
    const { contractIds } = req.body;
    
    if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Se requiere un array de contractIds'
      });
    }

    console.log('[NotificationRoutes] Notificando actualización de póliza para:', contractIds);
    
    // Obtener info de los contratos
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const contracts = await prisma.contract.findMany({
      where: { id: { in: contractIds } },
      select: {
        id: true,
        code: true,
        endDate: true,
        supplier: { select: { name: true } },
        policies: {
          select: {
            endDate: true
          }
        }
      }
    });

    const contractsWithPolicies = contracts.map((c: any) => {
      // Obtener la fecha de fin de póliza más lejana
      const polizaEndDate = c.policies && c.policies.length > 0 
        ? c.policies.reduce((latest: any, p: any) => {
            if (!latest) return p.endDate;
            if (!p.endDate) return latest;
            return p.endDate > latest ? p.endDate : latest;
          }, null)
        : null;
      
      return {
        id: c.id,
        code: c.code,
        supplierName: c.supplier.name,
        endDate: c.endDate,
        polizaEndDate
      };
    });

    const result = await notificationService.notifyPolicyUpdateNeeded(contractsWithPolicies);
    
    res.json({
      success: result.success,
      message: result.success 
        ? `Notificación de póliza enviada: ${result.emailsSent} emails`
        : 'Error al enviar notificación',
      details: {
        contractsNotified: contracts.length,
        emailsSent: result.emailsSent,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al notificar actualización de póliza',
      details: String(error)
    });
  }
};

// Rutas
router.post('/send-expiry-reminders', authenticate, authorize('ADMIN'), sendExpiryReminders);
router.get('/preview', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), getPreview);
router.get('/policies-preview', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), getPoliciesPreview);
router.get('/status', authenticate, authorize('ADMIN'), getStatus);
router.post('/trigger', authenticate, authorize('ADMIN'), triggerScheduler);
router.post('/policy-update', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), notifyPolicyUpdate);

export { sendExpiryReminders, getPreview, getPoliciesPreview, getStatus, triggerScheduler, notifyPolicyUpdate };
export default router;