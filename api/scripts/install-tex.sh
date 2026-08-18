#!/bin/sh
# ============================================================
# Instala Tectonic (XeTeX) + fuentes en imágenes Alpine del API.
# - Binario estático musl: NO depende de LaTeX en el host.
# - Precachea el bundle en build (TECTONIC_CACHE_DIR) para que
#   la primera compilación en runtime no necesite red.
# Idempotente: si tectonic ya existe, sale en 0.
# ============================================================
set -e

TECTONIC_VERSION="${TECTONIC_VERSION:-0.15.0}"
CACHE_DIR="${TECTONIC_CACHE_DIR:-/opt/tectonic-cache}"

if command -v tectonic >/dev/null 2>&1; then
  echo ">> Tectonic ya instalado ($(tectonic --version))."
  exit 0
fi

echo ">> Instalando dependencias del sistema (fontconfig, fuentes)..."
apk add --no-cache curl tar fontconfig font-dejavu

echo ">> Descargando tectonic ${TECTONIC_VERSION} (binario musl)..."
curl -fsSLO "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz"
tar -xzf "tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz"
mv tectonic /usr/local/bin/tectonic
rm -f "tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz"

echo ">> Precalentando caché del bundle (compila un documento mínimo)..."
mkdir -p "${CACHE_DIR}"
export TECTONIC_CACHE_DIR="${CACHE_DIR}"
printf '%s\n' \
  '\documentclass{article}' \
  '\begin{document}' \
  'Hola áéíóú ñ \% \& \_ 123' \
  '\end{document}' > /tmp/warm.tex
tectonic --outdir /tmp /tmp/warm.tex
rm -f /tmp/warm.tex /tmp/warm.pdf

echo ">> Tectonic listo: $(tectonic --version)"
