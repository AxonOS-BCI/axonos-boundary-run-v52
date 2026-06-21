#!/usr/bin/env bash
set -euo pipefail

VERSION="$(cat VERSION | tr -d '[:space:]')"
TAG="v${VERSION}"
NAME="axonos-boundary-run-${TAG}"
ASSETS="release-assets"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "FAIL: missing command: $1"; exit 1; }
}

need_cmd node
need_cmd python3
need_cmd zip
need_cmd tar
need_cmd sha256sum

rm -rf dist "$ASSETS"
mkdir -p "$ASSETS"

node qa/boundary-run-static-smoke-v52.mjs
python3 tools/boundary_run_audit_v52.py
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
bash scripts/reproducibility_check.sh
bash scripts/build_web.sh dist

(
  cd dist
  zip -qr "../${ASSETS}/${NAME}-dist.zip" .
)

TMP=".release-tmp/${NAME}"
rm -rf .release-tmp
mkdir -p "$TMP"
rsync -a ./ "$TMP" \
  --exclude '.git' \
  --exclude '.release-tmp' \
  --exclude 'release-assets' \
  --exclude 'dist' \
  --exclude 'dist_build1' \
  --exclude 'dist_build2' \
  --exclude '.DS_Store' >/dev/null 2>&1 || {
    tar --exclude='.git' --exclude='.release-tmp' --exclude='release-assets' --exclude='dist' --exclude='dist_build1' --exclude='dist_build2' -cf - . | tar -xf - -C "$TMP"
  }

(
  cd .release-tmp
  zip -qr "../${ASSETS}/${NAME}-source.zip" "$NAME"
  tar -czf "../${ASSETS}/${NAME}-source.tar.gz" "$NAME"
)

cp RELEASE_NOTES_v52.0.0.md "$ASSETS/RELEASE_NOTES_v52.0.0.md"
(
  cd "$ASSETS"
  sha256sum * | sort > SHA256SUMS.txt
)

rm -rf .release-tmp

echo "Release assets built in ${ASSETS}:"
ls -lh "$ASSETS"
