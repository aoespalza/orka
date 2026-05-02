import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { createHash } from 'crypto';
import { settingsRepository } from '../repositories/settingsRepository';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;
  private initialized = false;

  private async getSettings(): Promise<EmailConfig | null> {
    try {
      const config = await settingsRepository.getSMTPConfig();
      return config;
    } catch {
      return null;
    }
  }

  private getCompanySettings(): { name: string; email: string } {
    return {
      name: process.env.COMPANY_NAME || 'Gestiona Sistema Compras CYG',
      email: process.env.COMPANY_EMAIL || 'noreply@procura.cl'
    };
  }

  private async initializeTransporter(): Promise<boolean> {
    if (this.initialized && this.transporter) return true;
    
    const settings = await this.getSettings();
    if (!settings) {
      console.log('[EmailService] SMTP no configurado');
      return false;
    }

    try {
      console.log('[EmailService] Conectando a:', settings.host, 'puerto:', settings.port);
      
      // Extraer el dominio del usuario autenticado para usarlo en EHLO
      const ehloName = settings.auth.user.split('@')[1] || settings.host;

      this.transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: {
          user: settings.auth.user,
          pass: settings.auth.pass
        },
        name: ehloName  // EHLO correcto: el dominio del remitente, no 127.0.0.1
      });
      
      this.config = settings;
      this.initialized = true;
      console.log('[EmailService] Transporter inicializado');
      return true;
    } catch (error: any) {
      console.error('[EmailService] Error:', error.message || error);
      return false;
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const initResult = await this.initializeTransporter();
    if (!initResult) {
      return { success: false, error: 'SMTP no configurado o error de conexión' };
    }

    const company = this.getCompanySettings();
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    console.log(`[EmailService] Enviando a: ${to}, Subject: ${options.subject}`);

    const mailOptions: SendMailOptions = {
      from: this.config?.from || `"${company.name}" <${company.email}>`,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    try {
      const info = await this.transporter!.sendMail(mailOptions);
      console.log(`[EmailService] ✓ Email enviado exitosamente a ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`[EmailService] ✗ Error al enviar email a ${to}:`, error.message || error);
      return { success: false, error: String(error) };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!await this.initializeTransporter()) {
      return { success: false, message: 'SMTP no configurado' };
    }

    try {
      await this.transporter!.verify();
      return { success: true, message: 'Conexión exitosa' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  async isConfigured(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings !== null;
  }

  reset(): void {
    this.transporter = null;
    this.config = null;
    this.initialized = false;
  }

  // Generar hash para verificar email
  static hashEmail(email: string): string {
    return createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 8);
  }
}

export const emailService = new EmailService();
export default emailService;