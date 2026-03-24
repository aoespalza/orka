import { Router } from 'express';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { settingsRepository } from '../../../infrastructure/repositories/settingsRepository';
import { emailService } from '../../../infrastructure/services/emailService';

const router = Router();

// ============================================
// RUTAS ESPECÍFICAS (deben ir antes de las rutas con parámetros)
// ============================================

// Limpiar configuración SMTP
router.delete('/smtp', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await settingsRepository.deleteByCategory('smtp');
    res.json({ success: true, message: 'Configuración SMTP eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar configuración SMTP' });
  }
});

// Get all settings
router.get('/', authenticate, async (req, res) => {
  try {
    const settings = await settingsRepository.findAll();
    const sanitized = settings.map(s => ({
      key: s.key,
      value: s.isSecret ? (s.value ? '••••••••' : '') : s.value,
      category: s.category,
      isSecret: s.isSecret
    }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Get settings by category
router.get('/category/:category', authenticate, async (req, res) => {
  try {
    const settings = await settingsRepository.findByCategory(req.params.category);
    const sanitized = settings.map(s => ({
      key: s.key,
      value: s.isSecret ? (s.value ? '••••••••' : '') : s.value,
      category: s.category,
      isSecret: s.isSecret
    }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Update multiple settings (bulk)
router.put('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Se requiere un array de settings' });
    }
    
    const results = await Promise.all(
      settings.map(async (s: { key: string; value: string; category?: string; isSecret?: boolean }) => {
        const setting = await settingsRepository.upsert({
          key: s.key,
          value: s.value,
          category: s.category,
          isSecret: s.isSecret
        });
        return { key: setting.key, value: setting.isSecret ? '••••••••' : setting.value };
      })
    );
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// Initialize settings
router.post('/initialize', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    res.json({ message: 'Configuración inicializada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al inicializar configuración' });
  }
});

// ============================================
// EMAIL SETTINGS
// ============================================

// Get email settings
router.get('/email', authenticate, async (req, res) => {
  try {
    const settings = await settingsRepository.findByCategory('smtp');
    const config: any = {};
    for (const s of settings) {
      if (s.key === 'smtp_host') config.host = s.value;
      else if (s.key === 'smtp_port') config.port = parseInt(s.value);
      else if (s.key === 'smtp_secure') config.secure = s.value === 'true';
      else if (s.key === 'smtp_user') config.user = s.value;
      else if (s.key === 'smtp_from') config.from = s.value;
    }
    res.json({ ...config, hasPassword: !!settings.find(s => s.key === 'smtp_pass' && s.value) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración de email' });
  }
});

// Save email settings
router.put('/email', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    console.log('[SETTINGS] Guardando email settings:', req.body);
    const { host, port, secure, user, password, from } = req.body;
    
    // Limpiar espacios en blanco
    const cleanHost = (host || '').trim();
    const cleanUser = (user || '').trim();
    const cleanPassword = password ? password.trim() : '';
    const cleanFrom = (from || '').trim();
    
    await settingsRepository.upsert({ key: 'smtp_host', value: cleanHost, category: 'smtp' });
    await settingsRepository.upsert({ key: 'smtp_port', value: String(port || 587), category: 'smtp' });
    await settingsRepository.upsert({ key: 'smtp_secure', value: secure ? 'true' : 'false', category: 'smtp' });
    await settingsRepository.upsert({ key: 'smtp_user', value: cleanUser, category: 'smtp' });
    if (cleanPassword) {
      await settingsRepository.upsert({ key: 'smtp_pass', value: cleanPassword, category: 'smtp', isSecret: true });
    }
    if (cleanFrom) {
      await settingsRepository.upsert({ key: 'smtp_from', value: cleanFrom, category: 'smtp' });
    }
    
    console.log('[SETTINGS] Email settings guardados correctamente');
    res.json({ success: true, message: 'Configuración de email guardada' });
  } catch (error) {
    console.error('[SETTINGS] Error al guardar email settings:', error);
    res.status(500).json({ error: 'Error al guardar configuración de email' });
  }
});

// Test email
router.post('/test-email', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Se requiere el destinatario' });
    }
    
    console.log('[SETTINGS] Enviando email de prueba a:', to);
    
    const result = await emailService.send({
      to,
      subject: 'Prueba de configuración SMTP - Gestiona Sistema Compras CYG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Prueba de configuración SMTP</h2>
          <p>Este es un email de prueba enviado desde Gestiona Sistema Compras CYG.</p>
          <p>Si recibes este mensaje, la configuración SMTP está funcionando correctamente.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">Enviado el ${new Date().toLocaleString('es-CL')}</p>
        </div>
      `
    });
    
    if (result.success) {
      res.json({ success: true, message: 'Email de prueba enviado correctamente', messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('[SETTINGS] Error al enviar email de prueba:', error);
    res.status(500).json({ error: 'Error al enviar email de prueba' });
  }
});

// ============================================
// COMPANY SETTINGS
// ============================================

// Get company settings
router.get('/company', authenticate, async (req, res) => {
  try {
    const settings = await settingsRepository.findByCategory('company');
    const config: any = {};
    for (const s of settings) {
      config[s.key.replace('company_', '')] = s.value;
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración de empresa' });
  }
});

// Save company settings
router.put('/company', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, rut, address, phone, email: compEmail } = req.body;
    
    if (name) await settingsRepository.upsert({ key: 'company_name', value: name, category: 'company' });
    if (rut) await settingsRepository.upsert({ key: 'company_rut', value: rut, category: 'company' });
    if (address) await settingsRepository.upsert({ key: 'company_address', value: address, category: 'company' });
    if (phone) await settingsRepository.upsert({ key: 'company_phone', value: phone, category: 'company' });
    if (compEmail) await settingsRepository.upsert({ key: 'company_email', value: compEmail, category: 'company' });
    
    res.json({ success: true, message: 'Configuración de empresa guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar configuración de empresa' });
  }
});

// ============================================
// RUTAS CON PARÁMETROS (deben ir al final)
// ============================================

// Update single setting - debe ir al final para no capturar otras rutas
router.put('/:key', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category, isSecret } = req.body;
    
    const setting = await settingsRepository.upsert({
      key,
      value: value || '',
      category,
      isSecret
    });
    
    res.json({ key: setting.key, value: setting.isSecret ? '••••••••' : setting.value });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;