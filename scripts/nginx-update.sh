#!/bin/bash
# ============================================
# nginx-update.sh — reglages SEO de naatalstudio.com, a lancer sur le serveur.
# Depuis le Mac : bash scripts/deploy.sh --nginx
#   --check   montre les changements sans rien appliquer
# Restaure la configuration si `nginx -t` echoue.
# ============================================
set -euo pipefail

CONF=/etc/nginx/sites-available/naatalstudio.com
NEXT=$(mktemp)
cp "$CONF" "$NEXT"

# Pages de services pour les robots
grep -q 'seo/services' "$NEXT" || sed -i '/rewrite \^\/offres\/?\$/a\            rewrite ^/services/([a-z0-9-]+)/?$ /seo/services/$1.html last;' "$NEXT"

# HTML revalide a chaque visite : une nouvelle version s'affiche sans vider le cache
grep -q 'expires -1;' "$NEXT" || sed -i '/^    location \/ {$/a\        expires -1;' "$NEXT"

# Compression
grep -q 'gzip_types' "$NEXT" || sed -i '0,/index index.html;/s//index index.html;\n\n    gzip_comp_level 6;\n    gzip_min_length 1024;\n    gzip_vary on;\n    gzip_proxied any;\n    gzip_types text\/css application\/javascript text\/javascript application\/json image\/svg+xml text\/plain text\/markdown application\/xml;/' "$NEXT"

# Un seul domaine : www redirige vers le domaine principal
grep -q 'return 301 https://naatalstudio.com' "$NEXT" || sed -i '0,/server_name naatalstudio.com www.naatalstudio.com;/s//&\n\n    if ($host = www.naatalstudio.com) {\n        return 301 https:\/\/naatalstudio.com$request_uri;\n    }/' "$NEXT"

if [ "${1:-}" = "--check" ]; then
  diff -u "$CONF" "$NEXT" || true
  rm -f "$NEXT"
  exit 0
fi

if cmp -s "$CONF" "$NEXT"; then
  echo "Configuration déjà à jour."
  rm -f "$NEXT"
  exit 0
fi

sudo -v -p "Mot de passe de %u (rien ne s'affiche), puis Entrée : "
echo "Mot de passe accepté."

BACKUP="$HOME/naatal-backups/nginx-$(date +%Y%m%d-%H%M%S).conf"
mkdir -p "$(dirname "$BACKUP")"
cp "$CONF" "$BACKUP"

sudo cp "$NEXT" "$CONF"
rm -f "$NEXT"

if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "Nginx rechargé. Sauvegarde : $BACKUP"
else
  sudo cp "$BACKUP" "$CONF"
  echo "Configuration invalide, ancienne version restaurée." >&2
  exit 1
fi
