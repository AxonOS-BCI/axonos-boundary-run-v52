#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
hash_tree() {
  local dir="$1"
  (cd "$dir" && find . -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')
}
rm -rf dist_build1 dist_build2
bash scripts/build_web.sh dist_build1 >/dev/null
HASH1="$(hash_tree dist_build1)"
bash scripts/build_web.sh dist_build2 >/dev/null
HASH2="$(hash_tree dist_build2)"
rm -rf dist_build1 dist_build2
if [ "$HASH1" != "$HASH2" ]; then
  echo "REPRODUCIBILITY FAILURE: $HASH1 != $HASH2"
  exit 1
fi
echo "REPRODUCIBILITY OK: $HASH1"
