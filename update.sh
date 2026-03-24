#!/bin/bash

# ============================================
# Orka - Script de actualización
# ============================================

set -e

echo "========================================"
echo "  Actualizando Orka"
echo "========================================"

cd /opt/oka

# Guardar cambios locales si existen
git stash

# Pull del repositorio
git pull origin master

# Reconstruir servicios
docker-compose up -d --build

# Verificar que todo esté corriendo
echo ""
echo "Verificando servicios..."
docker ps | grep orka

echo ""
echo "========================================"
echo "  Actualización completada"
echo "========================================"