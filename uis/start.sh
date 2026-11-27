#!/bin/sh
set -eu

MODE="${1:-${APP_MODE:-dev}}"

cleanup() {
  echo "[uis] Deteniendo website y backoffice..."
  kill "${WEBSITE_PID:-}" "${BACKOFFICE_PID:-}" 2>/dev/null || true
  if [ -n "${WEBSITE_PID:-}" ]; then wait "$WEBSITE_PID" 2>/dev/null || true; fi
  if [ -n "${BACKOFFICE_PID:-}" ]; then wait "$BACKOFFICE_PID" 2>/dev/null || true; fi
}
trap cleanup INT TERM

if [ "$MODE" = "prod" ]; then
  echo "[uis] Iniciando website y backoffice en modo producción..."
  (cd /app/website && exec npm run start) &
  WEBSITE_PID=$!
  (cd /app/backoffice && exec npm run start) &
  BACKOFFICE_PID=$!
else
  echo "[uis] Iniciando website y backoffice en modo desarrollo..."
  (cd /app/website && exec npm run dev) &
  WEBSITE_PID=$!
  (cd /app/backoffice && exec npm run dev) &
  BACKOFFICE_PID=$!
fi

wait "$WEBSITE_PID"