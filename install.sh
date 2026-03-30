#!/bin/bash

# ============================================
# Orka - Sistema de Compras para Construcción Civil
# Script de instalación para Ubuntu Server (SIN DOCKER)
# ============================================

set -e

echo "========================================"
echo "  Instalación de Orka (Sin Docker)"
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
# 2. Instalar dependencias básicas
# ============================================
info "Instalando dependencias básicas..."
apt install -y curl wget git build-essential

# ============================================
# 3. Instalar PostgreSQL
# ============================================
info "Instalando PostgreSQL..."

# Verificar si ya está instalado
if command -v psql &> /dev/null; then
  warn "PostgreSQL ya está instalado"
else
  # Instalar PostgreSQL
  apt install -y postgresql postgresql-contrib

  # Iniciar servicio
  systemctl enable postgresql
  systemctl start postgresql
fi

# ============================================
# 4. Configurar PostgreSQL
# ============================================
info "Configurando PostgreSQL..."

# Contraseña para usuario postgres
DB_PASSWORD="orka2026"

# Cambiar contraseña del usuario postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';"

# Crear base de datos
sudo -u postgres psql -c "DROP DATABASE IF EXISTS orka_reducida;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE orka_reducida;"

info "Base de datos 'orka_reducida' creada"

# ============================================
# 5. Instalar Node.js 20.x
# ============================================
info "Instalando Node.js 20.x..."

if command -v node &> /dev/null; then
  warn "Node.js ya está instalado: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi

info "Node.js $(node -v) instalado"

# ============================================
# 6. Instalar PM2 (gestor de procesos)
# ============================================
info "Instalando PM2..."
npm install -g pm2

# ============================================
# 7. Instalar Nginx
# ============================================
info "Instalando Nginx..."

if command -v nginx &> /dev/null; then
  warn "Nginx ya está instalado"
else
  apt install -y nginx
fi

# ============================================
# 8. Configurar firewall
# ============================================
info "Configurando firewall..."

# Instalar ufw si no está
if ! command -v ufw &> /dev/null; then
  apt install -y ufw
fi

# Puertos necesarios
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 3006/tcp comment 'Orka Backend'

# Habilitar firewall
ufw --force enable
ufw reload

info "Firewall configurado"

# ============================================
# 9. Preparar directorio de la aplicación
# ============================================
info "Preparando directorio de la aplicación..."

APP_DIR="/opt/orka"
mkdir -p $APP_DIR

# Si ya existe, actualizar con git pull
if [ -d "$APP_DIR/.git" ]; then
  warn "El directorio $APP_DIR ya existe"
  read -p "¿Deseas actualizar el código? (s/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    cd $APP_DIR
    git pull origin master
  fi
else
  info "Clonando repositorio..."
  cd /opt
  rm -rf orka
  git clone https://github.com/aoespalza/orka_reducida.git orka
  cd $APP_DIR
fi

# ============================================
# 10. Configurar Backend
# ============================================
info "Configurando Backend..."

cd $APP_DIR/procuraBackend

# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Configurar variables de entorno
cat > .env << EOF
DATABASE_URL="postgresql://postgres:$DB_PASSWORD@localhost:5432/orka_reducida?schema=public"
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
PORT=3006
NODE_ENV=production
EOF

info "Variables de entorno del backend configuradas"

# Crear tablas en la base de datos (db push en lugar de migrate para proyectos sin migraciones)
info "Creando tablas en la base de datos..."
npx prisma db push

# Crear usuario admin inicial
info "Creando usuario administrador..."
node create_admin.js

# Compilar TypeScript
info "Compilando backend..."
npm run build

# ============================================
# 11. Configurar Frontend
# ============================================
info "Configurando Frontend..."

cd $APP_DIR/procuraFrontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cat > .env << EOF
VITE_API_URL=http://localhost:3006/api
EOF

# Compilar frontend
info "Compilando frontend..."
npm run build

# ============================================
# 12. Configurar Nginx
# ============================================
info "Configurando Nginx..."

# Crear configuración
cat > /etc/nginx/sites-available/orka << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend - Archivos estáticos
    location / {
        root /opt/orka/procuraFrontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3006/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3006/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/orka /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t

# Recargar Nginx
systemctl enable nginx
systemctl reload nginx

info "Nginx configurado"

# ============================================
# 13. Iniciar servicios con PM2
# ============================================
info "Iniciando servicios con PM2..."

# Detener procesos anteriores si existen
pm2 delete orka-backend 2>/dev/null || true

# Iniciar backend
cd $APP_DIR/procuraBackend
pm2 start npm --name orka-backend -- start

# Guardar configuración de PM2
pm2 save

# Configurar inicio automático
pm2 startup | tail -1 | bash

info "Servicios iniciados"

# ============================================
# 14. Verificar servicios
# ============================================
info "Verificando servicios..."

sleep 5

# Verificar Backend
if pm2 list | grep -q orka-backend; then
  info "✓ Backend corriendo en puerto 3006"
else
  error "✗ Backend no está corriendo"
fi

# Verificar Nginx
if systemctl is-active --quiet nginx; then
  info "✓ Nginx corriendo"
else
  error "✗ Nginx no está corriendo"
fi

# ============================================
# 15. Mostrar información final
# ============================================
echo ""
echo "========================================"
echo "  Instalación completada"
echo "========================================"
echo ""
echo "Servicios disponibles:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend:  http://$SERVER_IP:3006"
echo "  - API:      http://$SERVER_IP/api"
echo "  - Health:   http://$SERVER_IP/health"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs backend:  pm2 logs orka-backend"
echo "  - Reiniciar backend: pm2 restart orka-backend"
echo "  - Ver estado:       pm2 status"
echo "  - Reiniciar Nginx:  sudo systemctl reload nginx"
echo "  - Actualizar:       cd $APP_DIR && git pull && npm run build --prefix procuraFrontend && pm2 restart all"
echo ""
echo "Credenciales por defecto:"
echo "  - Usuario: admin"
echo "  - Contraseña: admin123"
echo ""
echo "========================================"
echo "Accede desde: http://$SERVER_IP"
echo "========================================"