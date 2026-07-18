#!/bin/bash
set -uo pipefail

echo "=== OSINT Labs: mise a jour des outils ==="
echo "Demarrage: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""
echo "[progress] 5 Preparation de la mise a jour"

pip_ok=0
go_ok=0
git_ok=0

echo "[systeme] Mise a jour des outils Ubuntu..."
echo "[progress] 7 Mise a jour des outils systeme"
apt-get update 2>&1 || echo "[systeme] Index indisponible, poursuite de la mise a jour"
apt-get install --only-upgrade -y \
  nmap whois dnsutils libimage-exiftool-perl whatweb curl wget git jq 2>&1 \
  || echo "[systeme] ERREUR (non bloquant)"
echo ""

echo "[pip] Mise a jour des paquets Python..."
echo "[progress] 10 Mise a jour des outils Python"
if pip3 install --upgrade \
    sherlock-project maigret theHarvester holehe socialscan \
    ghunt h8mail social-analyzer waybackpy snscrape \
    gunicorn flask flask-cors "yente-client[cli]" 2>&1; then
  pip_ok=1
  echo "[pip] OK"
else
  echo "[pip] ERREUR (non bloquant)"
fi
echo ""

echo "[pip] Mise a jour SpiderFoot, Recon-ng, Blackbird, GhostTrack..."
echo "[progress] 30 Mise a jour des dependances"
for req in /opt/spiderfoot/requirements.txt /opt/recon-ng/REQUIREMENTS \
           /opt/blackbird/requirements.txt /opt/GhostTrack/requirements.txt; do
  if [ -f "$req" ]; then
    pip3 install --upgrade -r "$req" 2>&1 || true
  fi
done
echo ""

echo "[go] Mise a jour des binaires Go..."
echo "[progress] 48 Mise a jour des binaires"
if USE_LATEST=1 /opt/osint/scripts/install-go-binaries.sh 2>&1; then
  go_ok=1
  echo "[go] OK"
else
  echo "[go] ERREUR (non bloquant)"
fi
echo ""

echo "[git] Mise a jour des depots clones..."
echo "[progress] 65 Mise a jour des depots"
for repo in /opt/spiderfoot /opt/recon-ng /opt/blackbird /opt/GhostTrack \
            /opt/social-analyzer /opt/osint/awesome-osint /opt/osint/scripts-collection; do
  if [ -d "$repo/.git" ]; then
    echo "  -> $repo"
    git -C "$repo" pull --ff-only 2>&1 || echo "     pull echoue pour $repo"
  fi
done
git_ok=1
echo ""

echo "[npm] Mise a jour Social Analyzer..."
echo "[progress] 82 Mise a jour de Social Analyzer"
if [ -f /opt/social-analyzer/package.json ]; then
  (cd /opt/social-analyzer && npm update 2>&1) || echo "[npm] ERREUR (non bloquant)"
fi
echo ""

echo "[nuclei] Mise a jour des templates..."
echo "[progress] 92 Mise a jour des modeles Nuclei"
if command -v nuclei >/dev/null 2>&1; then
  nuclei -update-templates 2>&1 || true
fi
echo ""

echo "=== Termine: $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
echo "[progress] 100 Mise a jour terminee"
if [ "$pip_ok" = "1" ] && [ "$go_ok" = "1" ]; then
  exit 0
fi
exit 0
