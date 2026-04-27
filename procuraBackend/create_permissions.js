const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const permissions = [
  { code: 'ADMIN', name: 'Administrador', category: 'admin' },
  { code: 'suppliers_create', name: 'Crear Proveedores', category: 'suppliers' },
  { code: 'suppliers_read', name: 'Ver Proveedores', category: 'suppliers' },
  { code: 'suppliers_update', name: 'Editar Proveedores', category: 'suppliers' },
  { code: 'suppliers_delete', name: 'Eliminar Proveedores', category: 'suppliers' },
  { code: 'contracts_create', name: 'Crear Contratos', category: 'contracts' },
  { code: 'contracts_read', name: 'Ver Contratos', category: 'contracts' },
  { code: 'contracts_update', name: 'Editar Contratos', category: 'contracts' },
  { code: 'contracts_delete', name: 'Eliminar Contratos', category: 'contracts' },
  { code: 'materials_create', name: 'Crear Materiales', category: 'materials' },
  { code: 'materials_read', name: 'Ver Materiales', category: 'materials' },
  { code: 'materials_update', name: 'Editar Materiales', category: 'materials' },
  { code: 'materials_delete', name: 'Eliminar Materiales', category: 'materials' },
  { code: 'purchase_orders_create', name: 'Crear Órdenes', category: 'purchase_orders' },
  { code: 'purchase_orders_read', name: 'Ver Órdenes', category: 'purchase_orders' },
  { code: 'purchase_orders_update', name: 'Editar Órdenes', category: 'purchase_orders' },
  { code: 'purchase_orders_delete', name: 'Eliminar Órdenes', category: 'purchase_orders' },
  { code: 'quotations_create', name: 'Crear Cotizaciones', category: 'quotations' },
  { code: 'quotations_read', name: 'Ver Cotizaciones', category: 'quotations' },
  { code: 'quotations_update', name: 'Editar Cotizaciones', category: 'quotations' },
  { code: 'quotations_delete', name: 'Eliminar Cotizaciones', category: 'quotations' },
  { code: 'settings_read', name: 'Ver Configuración', category: 'settings' },
  { code: 'settings_update', name: 'Editar Configuración', category: 'settings' },
];

async function main() {
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: { id: require('crypto').randomUUID(), ...p, isActive: true, createdAt: new Date(), updatedAt: new Date() }
    });
    console.log('Created:', p.code);
  }
}

main().then(() => { console.log('Done!'); prisma.$disconnect(); }).catch(e => { console.error(e); prisma.$disconnect(); });