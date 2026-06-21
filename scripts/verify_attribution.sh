#!/usr/bin/env bash
set -euo pipefail

REQUIRED="Denis Yermakou"
FILES=(
  README.md
  ATTRIBUTION.md
  package.json
  index.html
  src/game.js
  src/styles.css
  src/manifest.json
  RELEASE_NOTES_v52.0.0.md
  CHANGELOG.md
  LICENSE-AGPL
  LICENSE-COMMERCIAL
  SECURITY.md
  DONATIONS.md
  GOVERNANCE.md
  CONTRIBUTING.md
  TRADEMARK.md
  THIRD_PARTY_NOTICES.md
  docs/AxonOS_Boundary_Run_v52_Technical_Specification.md
  docs/TRACEABILITY_MATRIX.md
  docs/RELEASE_PROCESS.md
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
