import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { notificationService } from '../../../infrastructure/services/notificationService';

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
    
    res.json({
      days,
      contracts: preview.contracts,
      workOrders: preview.workOrders,
      total: preview.contracts.length + preview.workOrders.length
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ error: String(error) });
  }
};

// GET /api/notifications/status - Ver estado de notificaciones
const getStatus = async (req: Request, res: Response) => {
  try {
    const { emailService } = require('../../../infrastructure/services/emailService');
    const isEmailConfigured = await emailService.isConfigured();
    
    res.json({
      emailConfigured: isEmailConfigured,
      expiryDays: 7, // Default, se puede leer de settings
      lastRun: null // Se puede agregar tracking de última ejecución
    });
  } catch (error) {
    console.error('[NotificationRoutes] Error:', error);
    res.status(500).json({ error: String(error) });
  }
};

// Rutas
router.post('/send-expiry-reminders', authenticate, authorize('ADMIN'), sendExpiryReminders);
router.get('/preview', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), getPreview);
router.get('/status', authenticate, authorize('ADMIN'), getStatus);

export { sendExpiryReminders, getPreview, getStatus };
export default router;