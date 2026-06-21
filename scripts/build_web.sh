#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-dist}"
rm -rf "$OUT"
mkdir -p "$OUT/src" "$OUT/docs" "$OUT/assets"
bash scripts/verify_attribution.sh
cp index.html "$OUT/index.html"
cp -r src/* "$OUT/src/"
cp -r docs/* "$OUT/docs/"
cp README.md VERSION ATTRIBUTION.md LICENSE-AGPL LICENSE-COMMERCIAL SECURITY.md DONATIONS.md THIRD_PARTY_NOTICES.md TRADEMARK.md "$OUT/"
(
  cd "$OUT"
  find . -type f ! -name SOURCE_MANIFEST.sha256 -print0 | sort -z | xargs -0 sha256sum > SOURCE_MANIFEST.sha256
)
echo "Built $OUT"
