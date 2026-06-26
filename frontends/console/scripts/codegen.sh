#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
CONSOLE="$(cd "$HERE/.." && pwd)"

echo "→ Services OpenAPI → src/api/schema.d.ts"
npx openapi-typescript "$ROOT/openapi/services/v1.yaml" -o "$CONSOLE/src/api/schema.d.ts"

echo "→ Core OpenAPI → src/api/core-schema.d.ts"
node "$HERE/gen-core-schema.mjs"

echo "✅ Console API types generated"
