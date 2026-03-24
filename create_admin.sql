INSERT INTO "User" (id, username, password, email, role, name, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$10$rQZ8K8Y8Y8Y8Y8Y8Y8Y8YO8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8',
  'admin@procura.cl',
  'ADMIN',
  'Administrador',
  true,
  NOW(),
  NOW()
);
