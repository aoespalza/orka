// Script para inicializar permisos y perfiles
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const permissions = [
  { code: 'materials_view', name: 'Ver Materiales', category: 'materials' },
  { code: 'materials_create', name: 'Crear Materiales', category: 'materials' },
  { code: 'materials_edit', name: 'Editar Materiales', category: 'materials' },
  { code: 'materials_delete', name: 'Eliminar Materiales', category: 'materials' },
  { code: 'suppliers_view', name: 'Ver Proveedores', category: 'suppliers' },
  { code: 'suppliers_create', name: 'Crear Proveedores', category: 'suppliers' },
  { code: 'suppliers_edit', name: 'Editar Proveedores', category: 'suppliers' },
  { code: 'suppliers_delete', name: 'Eliminar Proveedores', category: 'suppliers' },
  { code: 'quotations_view', name: 'Ver Cotizaciones', category: 'quotations' },
  { code: 'quotations_create', name: 'Crear Cotizaciones', category: 'quotations' },
  { code: 'quotations_approve', name: 'Aprobar Cotizaciones', category: 'quotations' },
  { code: 'orders_view', name: 'Ver Órdenes', category: 'orders' },
  { code: 'orders_create', name: 'Crear Órdenes', category: 'orders' },
  { code: 'orders_approve', name: 'Aprobar Órdenes', category: 'orders' },
  { code: 'orders_receive', name: 'Recibir Órdenes', category: 'orders' },
  { code: 'contracts_view', name: 'Ver Contratos', category: 'contracts' },
  { code: 'contracts_create', name: 'Crear Contratos', category: 'contracts' },
  { code: 'contracts_edit', name: 'Editar Contratos', category: 'contracts' },
  { code: 'contracts_delete', name: 'Eliminar Contratos', category: 'contracts' },
  { code: 'reports_view', name: 'Ver Reportes', category: 'reports' },
  { code: 'reports_export', name: 'Exportar Reportes', category: 'reports' },
  { code: 'settings_view', name: 'Ver Configuración', category: 'settings' },
  { code: 'settings_edit', name: 'Editar Configuración', category: 'settings' },
  { code: 'users_view', name: 'Ver Usuarios', category: 'users' },
  { code: 'users_create', name: 'Crear Usuarios', category: 'users' },
  { code: 'users_edit', name: 'Editar Usuarios', category: 'users' },
  { code: 'users_delete', name: 'Eliminar Usuarios', category: 'users' },
];

const profiles = [
  { name: 'Administrador', description: 'Acceso completo al sistema', isDefault: false, permissions: permissions.map(p => p.code) },
  { name: 'Gerente de Compras', description: 'Gestión de compras y proveedores', isDefault: false, permissions: ['materials_view', 'materials_create', 'materials_edit', 'suppliers_view', 'suppliers_create', 'suppliers_edit', 'quotations_view', 'quotations_create', 'quotations_approve', 'orders_view', 'orders_create', 'orders_approve', 'contracts_view', 'contracts_create', 'contracts_edit', 'reports_view', 'reports_export'] },
  { name: 'Agente de Compras', description: 'Ejecución de operaciones de compra', isDefault: false, permissions: ['materials_view', 'suppliers_view', 'quotations_view', 'quotations_create', 'orders_view', 'orders_create', 'contracts_view'] },
  { name: 'Solicitante', description: 'Solo puede ver y crear solicitudes', isDefault: true, permissions: ['materials_view', 'suppliers_view', 'quotations_view', 'orders_view', 'contracts_view'] },
];

async function main() {
  console.log('Inicializando permisos y perfiles...');

  // 1. Crear permisos
  const permIds = {};
  for (const p of permissions) {
    const existing = await prisma.permission.findUnique({ where: { code: p.code } });
    if (!existing) {
      const created = await prisma.permission.create({
        data: { id: crypto.randomUUID(), ...p }
      });
      permIds[p.code] = created.id;
      console.log('✓ Creado:', p.code);
    } else {
      permIds[p.code] = existing.id;
      console.log('✓ Ya existe:', p.code);
    }
  }

  // 2. Crear perfiles
  for (const profile of profiles) {
    const existing = await prisma.profile.findUnique({ where: { name: profile.name } });
    if (!existing) {
      const created = await prisma.profile.create({
        data: {
          id: crypto.randomUUID(),
          name: profile.name,
          description: profile.description,
          isDefault: profile.isDefault,
          isActive: true
        }
      });
      
      // Asignar permisos
      for (const permCode of profile.permissions) {
        if (permIds[permCode]) {
          await prisma.profilePermission.create({
            data: {
              profileId: created.id,
              permissionId: permIds[permCode]
            }
          });
        }
      }
      console.log('✓ Creado perfil:', profile.name);
    } else {
      console.log('✓ Ya existe perfil:', profile.name);
    }
  }

  // 3. Asignar perfil Administrador al usuario admin si no tiene
  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (admin) {
    const adminProfile = await prisma.profile.findUnique({ where: { name: 'Administrador' } });
    if (adminProfile && !admin.profileId) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { profileId: adminProfile.id }
      });
      console.log('✓ Perfil Administrador asignado al usuario admin');
    }
  }

  console.log('✓ Seed completado');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());