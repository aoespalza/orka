#!/bin/bash

# ============================================
# Orka - Sistema de Compras para Construcción Civil
# Script de instalación para Ubuntu Server
# ============================================

set -e

echo "========================================"
echo "  Instalación de Orka"
echo "========================================"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar que se ejecute como root
if [ "$EUID" -ne 0 ]; then
  error "Por favor ejecuta como root: sudo ./install.sh"
  exit 1
fi

# ============================================
# 1. Actualizar sistema
# ============================================
info "Actualizando sistema..."
apt update && apt upgrade -y

# ============================================
# 2. Instalar Docker
# ============================================
if command -v docker &> /dev/null; then
  warn "Docker ya está instalado"
else
  info "Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $USER
fi

# ============================================
# 3. Instalar Docker Compose
# ============================================
if command -v docker-compose &> /dev/null; then
  warn "Docker Compose ya está instalado"
else
  info "Instalando Docker Compose..."
  apt install -y docker-compose
fi

# ============================================
# 4. Instalar Git (si no está)
# ============================================
if command -v git &> /dev/null; then
  warn "Git ya está instalado"
else
  info "Instalando Git..."
  apt install -y git
fi

# ============================================
# 5. Configurar firewall
# ============================================
info "Configurando firewall..."

# Instalar ufw si no está
if ! command -v ufw &> /dev/null; then
  apt install -y ufw
fi

# Puertos necesarios
ufw allow 3006/tcp comment 'Orka Backend'
ufw allow 5174/tcp comment 'Orka Frontend'
ufw allow 5434/tcp comment 'Orka PostgreSQL'

# Habilitar firewall
ufw --force enable
ufw reload

info "Firewall configurado"

# ============================================
# 6. Clonar repositorio
# ============================================
if [ -d "/opt/orka" ]; then
  warn "El directorio /opt/orka ya existe"
  read -p "¿Deseas actualizar el código? (s/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    cd /opt/orka
    git pull origin master
  fi
else
  info "Clonando repositorio..."
  mkdir -p /opt
  cd /opt
  git clone https://github.com/aoespalza/orka.git orka
  cd /opt/orka
fi

# ============================================
# 7. Configurar variables de entorno
# ============================================
info "Configurando variables de entorno..."

if [ ! -f "procuraBackend/.env" ]; then
  cp procuraBackend/.env.example procuraBackend/.env 2>/dev/null || true
fi

# Puerto para el frontend
if [ ! -f "procuraFrontend/.env" ]; then
  echo "VITE_API_URL=http://localhost:3006/api" > procuraFrontend/.env
fi

# ============================================
# 8. Construir y levantar servicios
# ============================================
info "Construyendo servicios (primera vez puede tardar)..."

cd /opt/orka
docker-compose up -d --build

# ============================================
# 9. Verificar servicios
# ============================================
info "Verificando servicios..."

sleep 10

# Verificar PostgreSQL
if docker ps | grep -q orka_db; then
  info "✓ PostgreSQL corriendo"
else
  error "✗ PostgreSQL no está corriendo"
fi

# Verificar Backend
if docker ps | grep -q orka_backend; then
  info "✓ Backend corriendo en puerto 3006"
else
  error "✗ Backend no está corriendo"
fi

# Verificar Frontend
if docker ps | grep -q orka_frontend; then
  info "✓ Frontend corriendo en puerto 5174"
else
  error "✗ Frontend no está corriendo"
fi

# ============================================
# 10. Mostrar información final
# ============================================
echo ""
echo "========================================"
echo "  Instalación completada"
echo "========================================"
echo ""
echo "Servicios disponibles:"
echo "  - Frontend: http://TU_IP:5174"
echo "  - Backend:  http://TU_IP:3006"
echo "  - API:      http://TU_IP:3006/api"
echo "  - Health:   http://TU_IP:3006/health"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs:     docker-compose logs -f"
echo "  - Reiniciar:    docker-compose restart"
echo "  - Detener:      docker-compose down"
echo "  - Actualizar:   cd /opt/orka && git pull && docker-compose up -d --build"
echo ""
echo "Credenciales por defecto:"
echo "  - Usuario: admin"
echo "  - Contraseña: admin123"
echo ""
echo "========================================"

# Obtener IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Accede desde: http://$SERVER_IP:5174"