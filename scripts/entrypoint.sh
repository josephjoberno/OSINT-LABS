#!/bin/bash
set -euo pipefail

mkdir -p /data/projects /var/log/osint-labs /run

if [ ! -f /data/.initialized ]; then
  cat > /data/README.txt <<'EOF'
OSINT Labs - Donnees persistantes
=================================

/data/projects/     Un dossier par projet (exports, uploads, notes)
Filebrowser:        http://localhost:8080/files/ (admin/admin par defaut)
EOF
  touch /data/.initialized
fi

echo "============================================"
echo "  OSINT Labs"
echo "  Dashboard:         http://localhost:8080"
echo "  Filebrowser:       http://localhost:8080/files/"
echo "  Terminal integre:  bouton dans le dashboard"
echo "  Seekr:             http://localhost:8080/seekr/web/"
echo "  SpiderFoot:        http://localhost:8080/spiderfoot/"
echo "============================================"

exec "$@"
