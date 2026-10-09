#!/usr/bin/env bash
# Nido · copia de seguridad de los datos del relé (siguen cifrados).
# Uso: bash backup.sh [carpeta]   (por defecto /root/nido-backups, guarda los últimos 14)
set -euo pipefail
OUT="${1:-/root/nido-backups}"
mkdir -p "$OUT"
FILE="nido-relay-$(date +%F).tgz"
docker run --rm -v nido_relay-data:/data:ro -v "$OUT":/backup alpine tar czf "/backup/$FILE" -C /data .
ls -1t "$OUT"/nido-relay-*.tgz | tail -n +15 | xargs -r rm --
echo "Copia guardada en $OUT/$FILE"
