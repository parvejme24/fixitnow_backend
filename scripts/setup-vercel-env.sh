#!/usr/bin/env bash
# Run from project root after: npx vercel login
# Usage: bash scripts/setup-vercel-env.sh

set -euo pipefail

PROD_URL="${BACKEND_URL:-https://fixitnow-backend-weld.vercel.app}"

if [ ! -f .env ]; then
  echo "Error: .env file not found. Create it from .env.example first."
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" .env | head -n 1 | cut -d'=' -f2- | sed 's/^"//;s/"$//'
}

DATABASE_URL="$(read_env DATABASE_URL)"
JWT_SECRET="$(read_env JWT_SECRET)"
APP_URL="$(read_env APP_URL)"
SP_ENDPOINT="$(read_env SP_ENDPOINT)"
SP_USERNAME="$(read_env SP_USERNAME)"
SP_PASSWORD="$(read_env SP_PASSWORD)"
SP_PREFIX="$(read_env SP_PREFIX)"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in .env"
  exit 1
fi

add_env() {
  local name="$1"
  local value="$2"
  local env="$3"
  echo "Adding $name to $env..."
  printf '%s' "$value" | npx vercel env add "$name" "$env" --force
}

for ENV in production preview; do
  echo ""
  echo "=== Setting $ENV environment ==="
  add_env DATABASE_URL "$DATABASE_URL" "$ENV"
  add_env JWT_SECRET "${JWT_SECRET:-change-me-in-production}" "$ENV"
  add_env NODE_ENV "production" "$ENV"
  add_env BACKEND_URL "$PROD_URL" "$ENV"
  add_env APP_URL "${APP_URL:-http://localhost:3000}" "$ENV"
  add_env SP_ENDPOINT "${SP_ENDPOINT:-https://sandbox.shurjopayment.com}" "$ENV"
  add_env SP_USERNAME "${SP_USERNAME:-}" "$ENV"
  add_env SP_PASSWORD "${SP_PASSWORD:-}" "$ENV"
  add_env SP_PREFIX "${SP_PREFIX:-SP}" "$ENV"
  add_env SP_RETURN_URL "${PROD_URL}/api/payments/shurjopay/callback" "$ENV"
done

echo ""
echo "Done! Redeploy with: npx vercel --prod"
