#!/bin/bash

# Easy Migration Script for Cloudevy
# Usage: ./migrate.sh "description of changes"

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Please provide a migration name"
  echo "Usage: ./migrate.sh \"add my feature\""
  exit 1
fi

MIGRATION_NAME=$(echo "$1" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_DIR="prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}"

echo "🚀 Starting migration: $MIGRATION_NAME"
echo ""

# Step 1: Push schema changes to database
echo "📊 Pushing schema changes to database..."
npx prisma db push

# Step 2: Create migration directory
echo "📁 Creating migration directory..."
mkdir -p "$MIGRATION_DIR"

# Step 3: Generate migration SQL
echo "📝 Generating migration SQL..."
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > "$MIGRATION_DIR/migration.sql"

# Step 4: Mark as applied
echo "✅ Marking migration as applied..."
npx prisma migrate resolve --applied "${TIMESTAMP}_${MIGRATION_NAME}"

# Step 5: Regenerate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Migration created: $MIGRATION_DIR"
echo ""
echo "🚀 Next steps:"
echo "  1. Test your changes locally"
echo "  2. Commit: git add . && git commit -m \"$1\""
echo "  3. Build: cd .. && ./build-images.sh"
echo "  4. Deploy: ./push-images.sh"
echo ""

