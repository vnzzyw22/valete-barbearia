#!/usr/bin/env bash
# Sobe o banco LOCAL e DESCARTÁVEL da Valete para testes: Postgres + PostgREST + gateway
# falso do Supabase (/rest/v1 e um Auth mínimo). Aplica as migrations reais e dados [TESTE].
# Nada aqui toca em Supabase real. Testado em Linux (Ubuntu 24.04, Postgres 16, root).
#
#   bash scripts/local-db/up.sh        # sobe tudo e recria o banco
#   bash scripts/local-db/up.sh reset  # só recria o banco (serviços já de pé)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
STATE="${VALETE_DB_STATE:-/tmp/valete-local-db}"          # fora do repositório
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
PGPORT="${PGPORT:-54322}" PGRST_PORT="${PGRST_PORT:-3001}" GATEWAY_PORT="${GATEWAY_PORT:-54321}"
PGDATA="${PGDATA:-/var/lib/valete-pg/data}"
PSQL="psql -h 127.0.0.1 -p $PGPORT -U postgres -v ON_ERROR_STOP=1 -q"
mkdir -p "$STATE/bin"

reset_db() {
  $PSQL -d postgres -c "drop database if exists valete_test with (force)" -c "create database valete_test"
  $PSQL -d postgres -c "do \$\$ begin
    if exists (select 1 from pg_roles where rolname = 'authenticator') then
      drop owned by anon, authenticated, service_role, authenticator cascade;
      drop role authenticator, anon, authenticated, service_role;
    end if; end \$\$;" >/dev/null 2>&1 || true
  $PSQL -d valete_test -f "$HERE/bootstrap.sql"
  for f in $(ls "$REPO"/supabase/migrations/*.sql | sort); do
    echo "migration: $(basename "$f")"
    $PSQL -d valete_test -f "$f"
  done
  $PSQL -d valete_test -f "$HERE/test-data.sql"
  $PSQL -d valete_test -c "notify pgrst, 'reload schema'"
  echo "banco valete_test recriado"
}

if [ "${1:-}" = "reset" ]; then reset_db; exit 0; fi

# 1) Postgres (initdb não roda como root: usa o usuário postgres)
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  mkdir -p "$PGDATA" && chown -R postgres:postgres "$(dirname "$PGDATA")"
  su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust -E UTF8 --locale=C.UTF-8" >/dev/null
fi
if ! pg_isready -h 127.0.0.1 -p "$PGPORT" -q; then
  su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-p $PGPORT -k $(dirname "$PGDATA") -c listen_addresses=127.0.0.1' -l $(dirname "$PGDATA")/pg.log start" >/dev/null
  sleep 2
fi

# 2) PostgREST (binário estático do GitHub)
if [ ! -x "$STATE/bin/postgrest" ]; then
  curl -sSL -o "$STATE/bin/pgrst.tar.xz" https://github.com/PostgREST/postgrest/releases/download/v12.2.3/postgrest-v12.2.3-linux-static-x64.tar.xz
  tar -xf "$STATE/bin/pgrst.tar.xz" -C "$STATE/bin"
fi

# 3) Segredo JWT local e chave anon (gerados aqui, nunca versionados)
[ -s "$STATE/jwt-secret.txt" ] || head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 48 > "$STATE/jwt-secret.txt"
ANON_KEY="$(SECRET_FILE="$STATE/jwt-secret.txt" node -e '
const c=require("crypto"),s=require("fs").readFileSync(process.env.SECRET_FILE,"utf8").trim();
const b=x=>Buffer.from(JSON.stringify(x)).toString("base64url");
const h=b({alg:"HS256",typ:"JWT"}),p=b({role:"anon",iss:"valete-local-test",iat:1760000000,exp:2000000000});
console.log(h+"."+p+"."+c.createHmac("sha256",s).update(h+"."+p).digest("base64url"))')"
cat > "$STATE/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:authenticator-local-test@127.0.0.1:$PGPORT/valete_test"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$(cat "$STATE/jwt-secret.txt")"
server-host = "127.0.0.1"
server-port = $PGRST_PORT
db-channel-enabled = true
CONF

reset_db

# 4) PostgREST + gateway em segundo plano
# PIDs guardados em arquivo: procurar pelo texto da linha de comando (pgrep -f) é frágil.
running() { [ -s "$STATE/$1.pid" ] && kill -0 "$(cat "$STATE/$1.pid")" 2>/dev/null; }
if ! running postgrest; then
  nohup "$STATE/bin/postgrest" "$STATE/postgrest.conf" < /dev/null > "$STATE/postgrest.log" 2>&1 &
  echo $! > "$STATE/postgrest.pid"
fi
if ! running gateway; then
  JWT_SECRET_FILE="$STATE/jwt-secret.txt" PGRST_PORT=$PGRST_PORT GATEWAY_PORT=$GATEWAY_PORT \
    nohup node "$HERE/gateway.mjs" < /dev/null > "$STATE/gateway.log" 2>&1 &
  echo $! > "$STATE/gateway.pid"
fi
sleep 2

echo
echo "Pronto. Coloque no .env.local (já ignorado pelo git):"
echo "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:$GATEWAY_PORT"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
echo "Admin de teste: admin@teste.local / senha-local-de-teste"
