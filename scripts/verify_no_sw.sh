#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
TARGETS=(index.html src)
for target in "${TARGETS[@]}"; do
  [ -e "$target" ] || continue
  if grep -RInE 'serviceWorker|navigator\.serviceWorker|sw\.js|workbox' "$target"; then
    echo "FAIL: service worker code detected in runtime source"
    exit 1
  fi
done
echo "OK: no service worker code detected in runtime source"
