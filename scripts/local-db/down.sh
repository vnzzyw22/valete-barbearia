#!/usr/bin/env bash
# Para o PostgREST e o gateway de teste (o Postgres local continua de pé).
STATE="${VALETE_DB_STATE:-/tmp/valete-local-db}"
for s in gateway postgrest; do
  [ -s "$STATE/$s.pid" ] && kill "$(cat "$STATE/$s.pid")" 2>/dev/null && echo "$s parado"
  rm -f "$STATE/$s.pid"
done
