#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
CONSOLE="$(cd "$HERE/.." && pwd)"

run_openapi_typescript() {
  (
    cd "${TMPDIR:-/tmp}"
    npx --yes --package typescript@5.9.3 --package openapi-typescript@7.13.0 openapi-typescript "$@"
  )
}

echo "→ Services OpenAPI → src/api/schema.d.ts"
run_openapi_typescript "$ROOT/openapi/services/v1.yaml" -o "$CONSOLE/src/api/schema.d.ts"

echo "→ Core OpenAPI → src/api/core-schema.d.ts"
node "$HERE/gen-core-schema.mjs"

echo "✅ Console API types generated"
