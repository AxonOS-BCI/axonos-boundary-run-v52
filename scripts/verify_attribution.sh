#!/usr/bin/env bash
set -euo pipefail

REQUIRED="Denis Yermakou"
FILES=(
  README.md
  ATTRIBUTION.md
  package.json
  index.html
  src/game.js
  src/manifest.json
  LICENSE-AGPL
  RELEASE_NOTES_v52.0.0.md
)

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "FAIL: missing attribution target: $f"
    exit 1
  fi
  if ! grep -q "$REQUIRED" "$f"; then
    echo "FAIL: attribution missing in $f"
    exit 1
  fi
done

if ! grep -q "https://axonos-bci.github.io/axonos-boundary-run-v52/" README.md; then
  echo "FAIL: README launch link missing"
  exit 1
fi

echo "OK: Denis Yermakou attribution verified"
