#!/usr/bin/env bash
# Backup do diretório de dados do SGOA
# Uso: ./scripts/backup-sgoa.sh [diretorio_destino]
set -euo pipefail

DIR_BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="${SGOA_DATA_DIR:-$DIR_BASE/data}"
DESTINO="${1:-$DIR_BASE/backup-$(date +%Y%m%d-%H%M%S)}"

mkdir -p "$DESTINO"
cp -a "$DATA_DIR"/. "$DESTINO"/
echo "Backup realizado em: $DESTINO"
echo "Arquivos copiados de: $DATA_DIR"
