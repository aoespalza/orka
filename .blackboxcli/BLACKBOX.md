# Orka Reducida - Sesión 23 abril 2026

## Configuración Local
- Proyecto: `C:\Users\aespalza\orka_reducida`
- Docker Compose: `orka_reducida_orka_network`
- Contenedores: `orka_db` (5432), `orka_backend` (3006), `orka_frontend` (5174)

## Arreglos Realizados

1. **Fix App.tsx**: Eliminados `/>`extra y referencias a `NewWorkOrderPage` inexistente
2. **Tabla Policy**: Creada en BD con `prisma db push --force-reset`
3. **Login admin**: Regenerado hash bcryptjs con script `/app/update_pwd.js`
4. **Nueva página Orden de Trabajo**: Creada `NewWorkOrderPage.tsx` + `NewWorkOrderPage.css`
5. **Menú lateral**: Usado `AppNavigator` con prop `showNewWorkOrder` para mantener sidebar

## Archivos Creados/Modificados
- `procuraFrontend/src/pages/NewWorkOrderPage.tsx` (nuevo)
- `procuraFrontend/src/pages/NewWorkOrderPage.css` (nuevo)
- `procuraFrontend/src/App.tsx` (modificado)

## Credenciales
- Usuario: `admin`
- Contraseña: `admin123`

## Rutas
- `/work-order-new` → Nueva Orden de Trabajo (página completa con menú lateral)

## Comandos Docker
```bash
cd C:\Users\aespalza\orka_reducida
docker-compose build && docker-compose up -d
```