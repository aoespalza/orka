import { Router } from 'express';
import { supplierController } from './supplierRoutes';
import { materialController } from './materialRoutes';
import { authController } from './authRoutes';
import workOrderController from './workOrderRoutes';
import projectController from './projectRoutes';
import contractController from './contractRoutes';
import dashboardRoutes from './dashboardRoutes';
import settingsRoutes from './settingsRoutes';
import uploadRoutes from './uploadRoutes';
import { permissionController } from './permissionRoutes';
import { profileController } from './profileRoutes';
import notificationRoutes, { sendExpiryReminders, getPreview, getPoliciesPreview, getStatus, notifyPolicyUpdate } from './notificationRoutes';
import { authenticate, authorize } from '../../../shared/middleware/auth';

const router = Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Login
router.post('/auth/login', authController.login);
router.post('/auth/seed-admin', authController.seedAdmin);
router.get('/auth/me', authenticate, authController.getProfile);

// Dashboard
router.use('/dashboard', dashboardRoutes);

// Upload
router.use('/upload', uploadRoutes);

// Settings
router.use('/settings', settingsRoutes);

// ============================================
// RUTAS PROTEGIDAS
// ============================================

// Perfiles (gestión de perfiles y permisos)
router.get('/profiles', authenticate, authorize('ADMIN'), profileController.getAll);
router.get('/profiles/:id', authenticate, authorize('ADMIN'), profileController.getById);
router.post('/profiles', authenticate, authorize('ADMIN'), profileController.create);
router.put('/profiles/:id', authenticate, authorize('ADMIN'), profileController.update);
router.delete('/profiles/:id', authenticate, authorize('ADMIN'), profileController.delete);
router.post('/profiles/:id/permissions', authenticate, authorize('ADMIN'), profileController.assignPermissions);
router.delete('/profiles/:id/permissions', authenticate, authorize('ADMIN'), profileController.removePermissions);
router.post('/profiles/seed', authenticate, authorize('ADMIN'), profileController.seed);

// Permisos
router.get('/permissions', authenticate, authorize('ADMIN'), permissionController.getAll);
router.get('/permissions/:id', authenticate, authorize('ADMIN'), permissionController.getById);
router.get('/permissions/category/:category', authenticate, authorize('ADMIN'), permissionController.getByCategory);
router.post('/permissions', authenticate, authorize('ADMIN'), permissionController.create);
router.put('/permissions/:id', authenticate, authorize('ADMIN'), permissionController.update);
router.delete('/permissions/:id', authenticate, authorize('ADMIN'), permissionController.delete);
router.post('/permissions/seed', authenticate, authorize('ADMIN'), permissionController.seed);

// Usuarios (solo ADMIN)
router.get('/users', authenticate, authorize('ADMIN'), authController.getAllUsers);
router.get('/users/:id', authenticate, authorize('ADMIN'), authController.getUserById);
router.post('/users', authenticate, authorize('ADMIN'), authController.createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), authController.deleteUser);
router.get('/auth/profile', authenticate, authController.getProfile);

// Obtener perfiles para usar al crear/editar usuarios
router.get('/profiles/list', authenticate, authorize('ADMIN'), authController.getAllProfiles);

// Proveedores
router.get('/suppliers', authenticate, supplierController.getAll);
router.get('/suppliers/:id', authenticate, supplierController.getById);
router.post('/suppliers', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), supplierController.create);
router.put('/suppliers/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), supplierController.update);
router.delete('/suppliers/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), supplierController.delete);
router.patch('/suppliers/:id/status', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), supplierController.updateStatus);

// Materiales
router.get('/materials', authenticate, materialController.getAll);
router.get('/materials/:id', authenticate, materialController.getById);
router.post('/materials', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), materialController.create);
router.put('/materials/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), materialController.update);
router.delete('/materials/:id', authenticate, authorize('ADMIN'), materialController.delete);

// Órdenes de Trabajo
router.get('/work-orders', authenticate, workOrderController.getAll);
router.get('/work-orders/:id', authenticate, workOrderController.getById);
router.post('/work-orders', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), workOrderController.create);
router.put('/work-orders/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), workOrderController.update);
router.delete('/work-orders/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), workOrderController.delete);
router.patch('/work-orders/:id/status', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), workOrderController.updateStatus);

// Proyectos
router.get('/projects', authenticate, projectController.getAll);
router.get('/projects/:id', authenticate, projectController.getById);
router.post('/projects', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), projectController.create);
router.put('/projects/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), projectController.update);
router.delete('/projects/:id', authenticate, authorize('ADMIN'), projectController.delete);
router.patch('/projects/:id/status', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), projectController.updateStatus);

// Contratos
router.get('/contracts', authenticate, contractController.getAll);
router.get('/contracts/:id', authenticate, contractController.getById);
router.post('/contracts', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), contractController.create);
router.put('/contracts/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER', 'PURCHASE_AGENT'), contractController.update);
router.delete('/contracts/:id', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), contractController.delete);
router.patch('/contracts/:id/status', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), contractController.updateStatus);

// Settings - usar el router de settingsRoutes
router.use('/settings', settingsRoutes);

// Notificaciones
router.post('/notifications/send-expiry-reminders', authenticate, authorize('ADMIN'), sendExpiryReminders);
router.get('/notifications/preview', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), getPreview);
router.get('/notifications/policies-preview', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), getPoliciesPreview);
router.get('/notifications/status', authenticate, authorize('ADMIN'), getStatus);
router.post('/notifications/policy-update', authenticate, authorize('ADMIN', 'PURCHASE_MANAGER'), notifyPolicyUpdate);

export default router;
