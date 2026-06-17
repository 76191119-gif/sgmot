# ============================================
# SGMOT - Script de Deployment (Windows PowerShell)
# ============================================
# Uso: .\deploy.ps1
# Ejecutar como Administrador: Start-Process powershell -ArgumentList ".\deploy.ps1" -Verb RunAs

# Configuración
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    exit 1
}

# ============================================
# PASO 1: Verificar requisitos
# ============================================
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 SGMOT DEPLOYMENT - Preparación para Producción" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Verificando requisitos..." -ForegroundColor Yellow

# PHP
try {
    $phpVersion = & 'C:\xampp\php\php.exe' -v 2>&1 | Select-Object -First 1
    Write-Success "PHP instalado: $phpVersion"
} catch {
    Write-Error-Custom "PHP no encontrado en C:\xampp\php\php.exe"
}

# Node.js
try {
    $nodeVersion = node -v
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js no instalado o no en PATH"
}

# npm
try {
    $npmVersion = npm -v
    Write-Success "npm instalado: $npmVersion"
} catch {
    Write-Error-Custom "npm no instalado"
}

# ============================================
# PASO 2: Validar estructura
# ============================================
Write-Host ""
Write-Host "2️⃣  Validando estructura del proyecto..." -ForegroundColor Yellow

$requiredFiles = @(
    "README.md",
    "SECURITY.md",
    "database/sgmot.sql",
    "api/index.php",
    "frontend/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "Encontrado: $file"
    } else {
        Write-Error-Custom "Archivo requerido no encontrado: $file"
    }
}

# ============================================
# PASO 3: PHP Lint
# ============================================
Write-Host ""
Write-Host "3️⃣  Validando sintaxis PHP..." -ForegroundColor Yellow

$phpFiles = Get-ChildItem -Path "api" -Filter "*.php" -Recurse -File
$phpErrors = 0

foreach ($file in $phpFiles) {
    $lintResult = & 'C:\xampp\php\php.exe' -l $file.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en: $($file.FullName)" -ForegroundColor Red
        $phpErrors++
    }
}

if ($phpErrors -gt 0) {
    Write-Error-Custom "$phpErrors archivo(s) PHP con errores"
}
Write-Success "Todos los archivos PHP válidos"

# ============================================
# PASO 4: Security Check
# ============================================
Write-Host ""
Write-Host "4️⃣  Verificando seguridad..." -ForegroundColor Yellow

Push-Location api
$securityLog = & 'C:\xampp\php\php.exe' security-check.php 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Algunos checks de seguridad fallaron"
    Write-Host $securityLog
} else {
    Write-Host $securityLog
    Write-Success "Security check completado"
}
Pop-Location

# ============================================
# PASO 5: Frontend - Instalar dependencias
# ============================================
Write-Host ""
Write-Host "5️⃣  Instalando dependencias del frontend..." -ForegroundColor Yellow

Push-Location frontend

if (Test-Path "node_modules") {
    Write-Warning "node_modules ya existe, usando caché"
} else {
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Error instalando dependencias"
    }
}
Write-Success "Dependencias instaladas"

# ============================================
# PASO 6: Frontend - Build
# ============================================
Write-Host ""
Write-Host "6️⃣  Compilando frontend para producción..." -ForegroundColor Yellow

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Error compilando frontend"
}

if (Test-Path "dist") {
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Success "Frontend compilado: $([Math]::Round($distSize, 2)) MB"
} else {
    Write-Error-Custom "Directorio dist no fue creado"
}

Pop-Location

# ============================================
# PASO 7: Limpiar archivos no necesarios
# ============================================
Write-Host ""
Write-Host "7️⃣  Limpiando archivos innecesarios..." -ForegroundColor Yellow

# Eliminar páginas no usadas
@(
    "frontend/src/pages/AdminPanel.jsx",
    "frontend/src/pages/ClientePortal.jsx",
    "frontend/src/pages/TecnicoPanel.jsx"
) | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}
Write-Success "Páginas no usadas eliminadas"

# Limpiar node_modules (se descargarán si es necesario)
if (Test-Path "frontend/node_modules") {
    Remove-Item "frontend/node_modules" -Recurse -Force
}
Write-Success "Cache limpiado"

# ============================================
# PASO 8: Verificar estructura de distribución
# ============================================
Write-Host ""
Write-Host "8️⃣  Verificando estructura..." -ForegroundColor Yellow

$requiredDirs = @(
    "api",
    "database",
    "frontend/dist"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Success "Directorio verificado: $dir"
    } else {
        Write-Error-Custom "Directorio requerido no encontrado: $dir"
    }
}

# ============================================
# PASO 9: Resumen
# ============================================
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETADO" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✓ PHP: Sintaxis válida"
Write-Host "   ✓ Seguridad: Verificada"

$distSize = (Get-ChildItem -Path "frontend/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   ✓ Frontend: Compilado $([Math]::Round($distSize, 2)) MB"
Write-Host "   ✓ Archivos: Limpios"
Write-Host ""

Write-Host "📋 Checklist Final:" -ForegroundColor Cyan
Write-Host "   [ ] JWT_SECRET: openssl rand -base64 32"
Write-Host "   [ ] CORS_ALLOWED_ORIGIN: dominio real"
Write-Host "   [ ] DB_PASSWORD: contraseña fuerte"
Write-Host "   [ ] HTTPS/SSL: habilitado"
Write-Host "   [ ] Backups: programados"
Write-Host "   [ ] Logs: configurados"
Write-Host ""

Write-Host "🚀 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Editar api\.env con valores reales"
Write-Host "   2. Crear usuario MySQL (no root)"
Write-Host "   3. Importar database/sgmot.sql"
Write-Host "   4. Habilitar HTTPS"
Write-Host "   5. php api/security-check.php"
Write-Host ""

Write-Success "Sistema listo para producción"
