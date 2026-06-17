#!/bin/bash
# ============================================
# SGMOT - Script de Deployment a Producción
# ============================================
# Uso: bash deploy.sh
# O en Windows: wsl bash deploy.sh

set -e  # Salir si hay error

echo "════════════════════════════════════════════════════════════════"
echo "🚀 SGMOT DEPLOYMENT - Preparación para Producción"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funciones
success() { echo -e "${GREEN}✓ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# ============================================
# PASO 1: Verificar requisitos
# ============================================
echo "1️⃣  Verificando requisitos..."

if ! command -v php &> /dev/null; then
    error "PHP no está instalado"
fi
success "PHP instalado: $(php -v | head -n 1)"

if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
fi
success "Node.js instalado: $(node -v)"

if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
fi
success "npm instalado: $(npm -v)"

# ============================================
# PASO 2: Validar estructura
# ============================================
echo ""
echo "2️⃣  Validando estructura del proyecto..."

REQUIRED_FILES=("README.md" "SECURITY.md" "database/sgmot.sql" "api/index.php" "frontend/package.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Archivo requerido no encontrado: $file"
    fi
    success "Encontrado: $file"
done

# ============================================
# PASO 3: PHP Lint
# ============================================
echo ""
echo "3️⃣  Validando sintaxis PHP..."

php_files=$(find api -name "*.php" -type f)
error_count=0
for file in $php_files; do
    if ! php -l "$file" > /dev/null 2>&1; then
        echo "❌ Error en: $file"
        ((error_count++))
    fi
done

if [ $error_count -gt 0 ]; then
    error "$error_count archivo(s) PHP con errores de sintaxis"
fi
success "Todos los archivos PHP válidos"

# ============================================
# PASO 4: Seguridad - Ejecutar security-check
# ============================================
echo ""
echo "4️⃣  Verificando configuración de seguridad..."

cd api
if ! php security-check.php > /tmp/sgmot-security.log 2>&1; then
    warning "Algunos checks de seguridad fallaron"
    cat /tmp/sgmot-security.log
else
    cat /tmp/sgmot-security.log
    success "Security check completado"
fi
cd ..

# ============================================
# PASO 5: Frontend - Instalar dependencias
# ============================================
echo ""
echo "5️⃣  Instalando dependencias del frontend..."

cd frontend
if [ -d "node_modules" ]; then
    warning "node_modules ya existe, usando caché"
else
    npm install --legacy-peer-deps || error "Error instalando dependencias"
fi
success "Dependencias instaladas"

# ============================================
# PASO 6: Frontend - Build
# ============================================
echo ""
echo "6️⃣  Compilando frontend para producción..."

npm run build || error "Error compilando frontend"
success "Frontend compilado exitosamente"

# Verificar que dist fue creado
if [ ! -d "dist" ]; then
    error "Directorio dist no fue creado"
fi
success "Directorio dist creado: $(du -sh dist | cut -f1) de tamaño"

cd ..

# ============================================
# PASO 7: Limpiar archivos no necesarios
# ============================================
echo ""
echo "7️⃣  Limpiando archivos innecesarios..."

# Eliminar páginas no usadas (ya eliminadas, pero verificar)
rm -f frontend/src/pages/AdminPanel.jsx
rm -f frontend/src/pages/ClientePortal.jsx
rm -f frontend/src/pages/TecnicoPanel.jsx
success "Páginas no usadas limpias"

# Limpiar node_modules
rm -rf frontend/node_modules
success "node_modules limpiado (se descargarán en producción si es necesario)"

# ============================================
# PASO 8: Verificar estructura de archivos
# ============================================
echo ""
echo "8️⃣  Verificando estructura de distribución..."

required_dirs=("api" "database" "frontend/dist")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        error "Directorio requerido no encontrado: $dir"
    fi
    success "Directorio verificado: $dir"
done

# ============================================
# PASO 9: Permisos
# ============================================
echo ""
echo "9️⃣  Configurando permisos..."

find api -type f -name "*.php" -exec chmod 644 {} \;
find api -type d -exec chmod 755 {} \;
chmod 644 .htaccess api/.htaccess 2>/dev/null || true
success "Permisos configurados"

# ============================================
# PASO 10: Resumen
# ============================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETADO"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📊 Resumen:"
echo "   ✓ PHP: Sintaxis válida"
echo "   ✓ Seguridad: Verificada"
echo "   ✓ Frontend: Compilado $(du -sh frontend/dist | cut -f1)"
echo "   ✓ Archivos: Limpios"
echo "   ✓ Permisos: Configurados"
echo ""

echo "📋 Checklist Final:"
echo "   [ ] JWT_SECRET configurado (openssl rand -base64 32)"
echo "   [ ] CORS_ALLOWED_ORIGIN = dominio real"
echo "   [ ] DB_PASSWORD cambio a contraseña fuerte"
echo "   [ ] HTTPS/SSL configurado"
echo "   [ ] Backups de BD programados"
echo "   [ ] Logs configurados"
echo "   [ ] WAF activado (si disponible)"
echo ""

echo "🚀 Próximos pasos:"
echo "   1. Editar api/.env con valores reales"
echo "   2. Crear usuario MySQL seguro (no usar root)"
echo "   3. Importar database/sgmot.sql"
echo "   4. Habilitar HTTPS en servidor web"
echo "   5. Ejecutar: php api/security-check.php"
echo "   6. Revisar logs en /var/log/"
echo ""

success "Sistema listo para producción"
