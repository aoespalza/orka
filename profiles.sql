-- Perfiles para Orka Reducida
-- Administrador (todos los permisos)
INSERT INTO "Profile" (id, name, description, "isDefault", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Administrador', 'Acceso completo al sistema', false, true, NOW(), NOW());

-- Gerente de Compras
INSERT INTO "Profile" (id, name, description, "isDefault", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Gerente de Compras', 'Gestión de compras y proveedores', false, true, NOW(), NOW());

-- Agente de Compras
INSERT INTO "Profile" (id, name, description, "isDefault", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Agente de Compras', 'Ejecución de operaciones de compra', false, true, NOW(), NOW());

-- Solicitante (default)
INSERT INTO "Profile" (id, name, description, "isDefault", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Solicitante', 'Solo puede ver y crear solicitudes', true, true, NOW(), NOW());