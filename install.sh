#!/usr/bin/env bash
# ============================================================
# SGMOT - Instalacion rapida del frontend (Mac/Linux)
# ============================================================
set -e

echo ""
echo "=== SGMOT - Instalando dependencias del frontend ==="
echo ""

cd "$(dirname "$0")/frontend"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm no esta instalado. Instala Node.js: https://nodejs.org"
  exit 1
fi

echo "Ejecutando: npm install"
echo "(esto puede tardar 2-5 minutos la primera vez)"
echo ""

npm install

echo ""
echo "============================================================"
echo " Listo. Ahora ejecuta: cd frontend && npm run dev"
echo " Y abre: http://localhost:5173"
echo "============================================================"
