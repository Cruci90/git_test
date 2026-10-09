#!/usr/bin/env bash
# Nido · prepara un servidor Ubuntu 24.04 recién creado y arranca el relé.
# Uso (como root):  bash setup-vps.sh nido.tu-dominio.com tu@correo.com
set -euo pipefail

DOMAIN="${1:?Uso: bash setup-vps.sh <dominio> <correo>}"
EMAIL="${2:?Uso: bash setup-vps.sh <dominio> <correo>}"
REPO="${REPO:-https://github.com/Cruci90/git_test.git}"
BRANCH="${BRANCH:-main}"
DIR=/opt/nido

[ "$(id -u)" -eq 0 ] || { echo "Ejecútalo como root (sudo -i)"; exit 1; }

echo "==> Actualizando el sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Instalando Docker"
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

echo "==> Cortafuegos: solo SSH, HTTP y HTTPS"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> Descargando Nido ($BRANCH)"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"; fi

cd "$DIR/nido/deploy"
if [ ! -f .env ]; then
  sed -e "s|^DOMAIN=.*|DOMAIN=$DOMAIN|" -e "s|^EMAIL=.*|EMAIL=$EMAIL|" .env.example > .env
fi

echo "==> Comprobando que $DOMAIN apunta a este servidor"
MYIP="$(curl -4 -fsS https://api.ipify.org || true)"
DNSIP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}' || true)"
if [ -n "$MYIP" ] && [ "$MYIP" != "$DNSIP" ]; then
  echo "AVISO: $DOMAIN apunta a '${DNSIP:-nada}' y este servidor es $MYIP."
  echo "       Caddy no podrá obtener el certificado hasta que el DNS apunte aquí (puede tardar unos minutos)."
fi

echo "==> Arrancando"
docker compose up -d --build

echo "==> Esperando el certificado y comprobando"
for _ in $(seq 1 30); do
  if curl -fsS "https://$DOMAIN/v1/health" 2>/dev/null; then
    echo; echo "Listo. En Nido → Ajustes → Compartir, usa: https://$DOMAIN"; exit 0
  fi
  sleep 5
done
echo "Aún no responde por HTTPS. Revisa el DNS y mira los registros con: docker compose -f $DIR/nido/deploy/docker-compose.yml logs caddy"
