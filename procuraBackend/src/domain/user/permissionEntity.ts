// Domain Entity: Permission
export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionDTO {
  code: string;
  name: string;
  description?: string;
  category: string;
}

export interface UpdatePermissionDTO {
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

// Permisos predefinidos del sistema
export const DEFAULT_PERMISSIONS: CreatePermissionDTO[] = [
  // Materiales
  { code: 'materials_view', name: 'Ver Materiales', category: 'materials' },
  { code: 'materials_create', name: 'Crear Materiales', category: 'materials' },
  { code: 'materials_edit', name: 'Editar Materiales', category: 'materials' },
  { code: 'materials_delete', name: 'Eliminar Materiales', category: 'materials' },
  
  // Proveedores
  { code: 'suppliers_view', name: 'Ver Proveedores', category: 'suppliers' },
  { code: 'suppliers_create', name: 'Crear Proveedores', category: 'suppliers' },
  { code: 'suppliers_edit', name: 'Editar Proveedores', category: 'suppliers' },
  { code: 'suppliers_delete', name: 'Eliminar Proveedores', category: 'suppliers' },
  
  // Cotizaciones
  { code: 'quotations_view', name: 'Ver Cotizaciones', category: 'quotations' },
  { code: 'quotations_create', name: 'Crear Cotizaciones', category: 'quotations' },
  { code: 'quotations_approve', name: 'Aprobar Cotizaciones', category: 'quotations' },
  
  // Órdenes
  { code: 'orders_view', name: 'Ver Órdenes', category: 'orders' },
  { code: 'orders_create', name: 'Crear Órdenes', category: 'orders' },
  { code: 'orders_approve', name: 'Aprobar Órdenes', category: 'orders' },
  { code: 'orders_receive', name: 'Recibir Órdenes', category: 'orders' },
  
  // Proyectos
  { code: 'projects_view', name: 'Ver Proyectos', category: 'projects' },
  { code: 'projects_create', name: 'Crear Proyectos', category: 'projects' },
  { code: 'projects_edit', name: 'Editar Proyectos', category: 'projects' },
  { code: 'projects_delete', name: 'Eliminar Proyectos', category: 'projects' },
  
  // Contratos
  { code: 'contracts_view', name: 'Ver Contratos', category: 'contracts' },
  { code: 'contracts_create', name: 'Crear Contratos', category: 'contracts' },
  { code: 'contracts_edit', name: 'Editar Contratos', category: 'contracts' },
  { code: 'contracts_delete', name: 'Eliminar Contratos', category: 'contracts' },
  
  // Reports
  { code: 'reports_view', name: 'Ver Reportes', category: 'reports' },
  { code: 'reports_export', name: 'Exportar Reportes', category: 'reports' },
  
  // Configuración
  { code: 'settings_view', name: 'Ver Configuración', category: 'settings' },
  { code: 'settings_edit', name: 'Editar Configuración', category: 'settings' },
  
  // Usuarios
  { code: 'users_view', name: 'Ver Usuarios', category: 'users' },
  { code: 'users_create', name: 'Crear Usuarios', category: 'users' },
  { code: 'users_edit', name: 'Editar Usuarios', category: 'users' },
  { code: 'users_delete', name: 'Eliminar Usuarios', category: 'users' },
];
