-- Asignar permisos a Administrador (todos)
INSERT INTO "ProfilePermission" ("profileId", "permissionId") 
SELECT 'c9f44532-b58d-48a8-9ef0-2bca231f820b', id FROM "Permission";

-- Asignar permisos a Gerente de Compras
INSERT INTO "ProfilePermission" ("profileId", "permissionId") 
SELECT '38dcb2de-a5fc-4250-ac15-ae9ac9ee309a', id FROM "Permission"
WHERE code IN (
  'quotations_view', 'quotations_create', 'quotations_approve',
  'orders_view', 'orders_create', 'orders_approve',
  'contracts_view', 'contracts_create', 'contracts_edit',
  'reports_view', 'reports_export'
);

-- Asignar permisos a Agente de Compras
INSERT INTO "ProfilePermission" ("profileId", "permissionId") 
SELECT 'b51ba31d-b1bd-425f-bd60-480b4c59a8fe', id FROM "Permission"
WHERE code IN (
  'quotations_view', 'quotations_create',
  'orders_view', 'orders_create',
  'contracts_view'
);

-- Asignar permisos a Solicitante
INSERT INTO "ProfilePermission" ("profileId", "permissionId") 
SELECT 'b95e9786-9fa8-4671-98ee-62b603487327', id FROM "Permission"
WHERE code IN (
  'quotations_view',
  'orders_view',
  'contracts_view'
);
