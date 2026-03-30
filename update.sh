#!/bin/bash

# ============================================
# Orka - Script de actualización (SIN DOCKER)
# ============================================

set -e

echo "========================================"
echo "  Actualizando Orka"
echo "========================================"

APP_DIR="/opt/orka"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then
  error "Por favor ejecuta como root: sudo ./update.sh"
  exit 1
fi

cd $APP_DIR

# ============================================
# 1. Guardar cambios locales si existen
# ============================================
info "Verificando cambios locales..."
git stash 2>/dev/null || true

# ============================================
# 2. Pull del repositorio
# ============================================
info "Actualizando código..."
git pull origin master

# ============================================
# 3. Actualizar Backend
# ============================================
info "Actualizando Backend..."

cd $APP_DIR/procuraBackend

# Instalar nuevas dependencias
npm install

# Verificar si hay cambios en el esquema de Prisma
info "Sincronizando base de datos..."
npx prisma db push

# Inicializar permisos y perfiles
info "Inicializando permisos y perfiles..."
node scripts/seed-permissions.js

# Compilar
info "Compilando Backend..."
npm run build

# Reiniciar PM2
pm2 restart orka-backend
info "Backend actualizado"

# ============================================
# 4. Actualizar Frontend
# ============================================
info "Actualizando Frontend..."

cd $APP_DIR/procuraFrontend

# Instalar nuevas dependencias
npm install

# Compilar
info "Compilando Frontend..."
npm run build

# ============================================
# 5. Recargar Nginx
# ============================================
info "Recargando Nginx..."
sudo systemctl reload nginx

# ============================================
# 6. Verificar servicios
# ============================================
echo ""
echo "Verificando servicios..."

# Verificar Backend
if pm2 list | grep -q orka-backend; then
  info "✓ Backend corriendo"
else
  error "✗ Backend no está corriendo"
fi

# Verificar Nginx
if systemctl is-active --quiet nginx; then
  info "✓ Nginx corriendo"
else
  error "✗ Nginx no está corriendo"
fi

# Probar health check
if curl -s http://localhost:3006/health > /dev/null; then
  info "✓ Health check OK"
else
  warn "⚠ Health check falló (puede ser normal si el servidor está iniciando)"
fi

# ============================================
# 7. Mostrar información final
# ============================================
echo ""
echo "========================================"
echo "  Actualización completada"
echo "========================================"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "Accede a: http://$SERVER_IP"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs: pm2 logs orka-backend"
echo "  - Estado:   pm2 status"
echo "========================================"