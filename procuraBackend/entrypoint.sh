#!/bin/sh

echo "Running Prisma migrations..."

MIGRATE_OUTPUT=$(node node_modules/.bin/prisma migrate deploy 2>&1)
MIGRATE_EXIT=$?

echo "$MIGRATE_OUTPUT"

if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
  echo "Schema exists without migration history. Baselining..."
  node node_modules/.bin/prisma migrate resolve --applied "20260313174113_init" 2>/dev/null || true
  node node_modules/.bin/prisma migrate resolve --applied "20260318004712_add_profile_permission_models" 2>/dev/null || true
  node node_modules/.bin/prisma migrate deploy
elif [ $MIGRATE_EXIT -ne 0 ]; then
  echo "Migration failed"
  exit 1
fi

echo "Starting server..."
exec node dist/index.js
