#!/bin/bash
# ============================================
# deploy.sh — deploie main sur le serveur de production.
#   bash scripts/deploy.sh             sauvegarde, backend, frontend
#   bash scripts/deploy.sh --dry-run   montre ce qui changerait, sans rien ecrire
#   bash scripts/deploy.sh --nginx     applique scripts/nginx-update.sh (mot de passe sudo)
# L'hote vient de CLAUDE.local.md. Revient en arriere si l'API ne repart pas.
# ============================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST=$(sed -nE 's/.*NAATAL_DEPLOY_HOST=([^` ]+).*/\1/p' CLAUDE.local.md 2>/dev/null | head -1 || true)
REMOTE_ROOT=/var/www/naatal
SSH_OPTS=(-o ConnectTimeout=10 -o ControlMaster=auto -o "ControlPath=$HOME/.ssh/cm-%C" -o ControlPersist=300)
RSYNC_SSH="ssh ${SSH_OPTS[*]}"
FRONT_EXCLUDES=(--exclude=server.js --exclude=package.json --exclude=package-lock.json --exclude=node_modules
  --exclude=.env --exclude=.env.example --exclude=config --exclude=controllers --exclude=middleware
  --exclude=models --exclude=routes --exclude=uploads --exclude=init.sql)
BACK_EXCLUDES=(--exclude=node_modules --exclude=.env --exclude=uploads)

fail() {
  echo "Déploiement annulé : $1" >&2
  exit 1
}

# Garde le code de sortie de rsync et n'affiche que les fichiers concernes
sync_files() {
  local output
  output=$(rsync --itemize-changes -e "$RSYNC_SSH" "$@")
  printf '%s\n' "$output" | grep -E '^(<f|cd\+|\*deleting)' | awk '{print $1, $2}' || true
}

[ -n "$HOST" ] || fail "NAATAL_DEPLOY_HOST absent de CLAUDE.local.md"

if [ "${1:-}" = "--nginx" ]; then
  scp "${SSH_OPTS[@]}" scripts/nginx-update.sh "$HOST:nginx-update.sh"
  ssh -t "${SSH_OPTS[@]}" "$HOST" 'bash nginx-update.sh && rm nginx-update.sh'
  exit 0
fi

DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

[ "$(git branch --show-current)" = "main" ] || fail "à lancer depuis main"
[ -z "$(git status --porcelain)" ] || fail "des modifications ne sont pas commitées"

VERSION=$(node -p "require('./package.json').version")

echo "=== Build v$VERSION ==="
if ! BUILD_LOG=$(VITE_API_URL=https://naatalstudio.com/api npm run build 2>&1); then
  printf '%s\n' "$BUILD_LOG" | tail -20
  fail "le build a échoué"
fi
printf '%s\n' "$BUILD_LOG" | grep -E 'built in|contrôle|version\.json' || true

# Sans cle sur le serveur, ce fichier garde sa cle de secours : la recherche de prospects reste active
if ! ssh "${SSH_OPTS[@]}" "$HOST" "grep -q '^SERPER_API_KEY=.' $REMOTE_ROOT/server/.env"; then
  echo "SERPER_API_KEY absente du serveur : prospectsController.js n'est pas envoyé."
  BACK_EXCLUDES+=(--exclude=controllers/prospectsController.js)
fi

if [ "$DRY_RUN" = true ]; then
  echo "=== Simulation backend ==="
  sync_files -azcn "${BACK_EXCLUDES[@]}" server/ "$HOST:$REMOTE_ROOT/server/"
  echo "=== Simulation frontend ==="
  sync_files -azcn --delete-after "${FRONT_EXCLUDES[@]}" dist/ "$HOST:$REMOTE_ROOT/dist/"
  echo "Simulation terminée, rien n'a été envoyé."
  exit 0
fi

echo "=== Sauvegarde du serveur ==="
BACKUP=$(ssh "${SSH_OPTS[@]}" "$HOST" bash -s -- "v$VERSION" <<'REMOTE'
set -eu
B="$HOME/naatal-backups/avant-$1-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$B"
cd /var/www/naatal
tar czf "$B/dist.tgz" dist
tar czf "$B/server.tgz" --exclude=node_modules --exclude=uploads --exclude=.env server
cat > "$B/rollback.sh" <<EOF
#!/bin/bash
set -e
T=\$(mktemp -d)
tar xzf "$B/dist.tgz" -C "\$T"
rsync -a --delete "\$T/dist/" /var/www/naatal/dist/
tar xzf "$B/server.tgz" -C "\$T"
rsync -a --exclude=node_modules --exclude=uploads --exclude=.env "\$T/server/" /var/www/naatal/server/
rm -rf "\$T"
pm2 restart naatal-api
EOF
echo "$B"
REMOTE
)
echo "$BACKUP"

echo "=== Backend ==="
sync_files -azc "${BACK_EXCLUDES[@]}" server/ "$HOST:$REMOTE_ROOT/server/"

ssh "${SSH_OPTS[@]}" "$HOST" bash -s -- "$BACKUP" <<'REMOTE'
set -u
cd /var/www/naatal/server

rollback() {
  echo "API en échec ($1) : retour arrière"
  pm2 logs naatal-api --lines 15 --nostream 2>&1 | tail -15
  bash "$BACKUP/rollback.sh"
  exit 1
}

BACKUP="$1"
node --check server.js || rollback "syntaxe"
pm2 restart naatal-api --update-env >/dev/null 2>&1 || rollback "pm2"

for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  if curl -s --max-time 3 http://127.0.0.1:5002/api/health | grep -q '"healthy"'; then
    echo "API saine après ${i}s"
    exit 0
  fi
done
rollback "injoignable"
REMOTE

# Migrations uniques : le site public lit l'email en base, et le reglage Offres doit exister
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE'
set -eu
cd /var/www/naatal/server
node -e "
require('dotenv').config();
const {Pool}=require('pg');
const p=new Pool({host:process.env.DB_HOST,port:process.env.DB_PORT,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD});
p.query(\"update settings set value='hello@naatalstudio.com' where key='contact_email' and value='naatalproduction@gmail.com'\")
 .then(()=>p.query(\"insert into settings (key, value, type, description) values ('offres_enabled', 'false', 'boolean', 'Onglet Offres : true = actif, false = désactivé') on conflict (key) do nothing\"))
 .then(()=>p.end());
"
REMOTE

echo "=== Frontend ==="
sync_files -azc --delete-after "${FRONT_EXCLUDES[@]}" dist/ "$HOST:$REMOTE_ROOT/dist/"

echo "=== Vérification ==="
curl -s --max-time 10 https://naatalstudio.com/version.json
curl -s --max-time 10 https://naatalstudio.com/api/health
echo
echo "Version $VERSION déployée. Retour arrière possible : ssh $HOST 'bash $BACKUP/rollback.sh'"
