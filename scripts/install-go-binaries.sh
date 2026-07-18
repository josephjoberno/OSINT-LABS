#!/bin/bash
# Installe les outils Go OSINT Labs via binaires GitHub (evite go install fragile).
set -euo pipefail

USE_LATEST="${USE_LATEST:-0}"

ARCH="$(dpkg --print-architecture 2>/dev/null || uname -m)"
case "$ARCH" in
  amd64|x86_64) GOARCH="amd64" ;;
  arm64|aarch64) GOARCH="arm64" ;;
  *)
    echo "Architecture non supportee: $ARCH" >&2
    exit 1
    ;;
esac

latest_tag() {
  curl -fsSL "https://api.github.com/repos/$1/releases/latest" | jq -r '.tag_name'
}

pick_version() {
  local repo=$1 pinned=$2
  if [ "$USE_LATEST" = "1" ]; then
    latest_tag "$repo"
  else
    echo "$pinned"
  fi
}

install_pd_zip() {
  local repo=$1 tool=$2 version=$3
  local ver="${version#v}"
  local file="${tool}_${ver}_linux_${GOARCH}.zip"
  local url="https://github.com/projectdiscovery/${repo}/releases/download/${version}/${file}"
  echo "  -> ${tool} ${version}"
  curl -fsSL "$url" -o "/tmp/${tool}.zip"
  unzip -o -j "/tmp/${tool}.zip" "${tool}" -d /usr/local/bin
  chmod +x "/usr/local/bin/${tool}"
  rm -f "/tmp/${tool}.zip"
}

install_gau() {
  local version=$1
  local ver="${version#v}"
  local file="gau_${ver}_linux_${GOARCH}.tar.gz"
  local url="https://github.com/lc/gau/releases/download/${version}/${file}"
  echo "  -> gau ${version}"
  curl -fsSL "$url" -o /tmp/gau.tgz
  tar -xzf /tmp/gau.tgz -C /usr/local/bin gau
  chmod +x /usr/local/bin/gau
  rm -f /tmp/gau.tgz
}

install_amass() {
  local version=$1
  local file="amass_linux_${GOARCH}.tar.gz"
  local url="https://github.com/owasp-amass/amass/releases/download/${version}/${file}"
  echo "  -> amass ${version}"
  curl -fsSL "$url" -o /tmp/amass.tgz
  tar -xzf /tmp/amass.tgz -C /tmp
  install -m 0755 "/tmp/amass_linux_${GOARCH}/amass" /usr/local/bin/amass
  rm -rf /tmp/amass.tgz "/tmp/amass_linux_${GOARCH}"
}

install_trufflehog() {
  local version=$1
  local ver="${version#v}"
  local file="trufflehog_${ver}_linux_${GOARCH}.tar.gz"
  local url="https://github.com/trufflesecurity/trufflehog/releases/download/${version}/${file}"
  echo "  -> trufflehog ${version}"
  curl -fsSL "$url" -o /tmp/trufflehog.tgz
  tar -xzf /tmp/trufflehog.tgz -C /usr/local/bin trufflehog
  chmod +x /usr/local/bin/trufflehog
  rm -f /tmp/trufflehog.tgz
}

echo "[go-binaries] Installation (${GOARCH}, USE_LATEST=${USE_LATEST})..."

SUBFINDER_V="$(pick_version projectdiscovery/subfinder v2.14.0)"
HTTPX_V="$(pick_version projectdiscovery/httpx v1.9.0)"
DNSX_V="$(pick_version projectdiscovery/dnsx v1.2.3)"
NUCLEI_V="$(pick_version projectdiscovery/nuclei v3.10.0)"
KATANA_V="$(pick_version projectdiscovery/katana v1.6.1)"
GAU_V="$(pick_version lc/gau v2.2.4)"
AMASS_V="$(pick_version owasp-amass/amass v5.1.1)"
TRUFFLEHOG_V="$(pick_version trufflesecurity/trufflehog v3.95.8)"

install_pd_zip subfinder subfinder "$SUBFINDER_V"
install_pd_zip httpx httpx "$HTTPX_V"
install_pd_zip dnsx dnsx "$DNSX_V"
install_pd_zip nuclei nuclei "$NUCLEI_V"
install_pd_zip katana katana "$KATANA_V"
install_gau "$GAU_V"
install_amass "$AMASS_V"
install_trufflehog "$TRUFFLEHOG_V"

for bin in subfinder httpx dnsx nuclei katana gau amass trufflehog; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "Binaire manquant apres installation: $bin" >&2
    exit 1
  fi
done

echo "[go-binaries] OK"
