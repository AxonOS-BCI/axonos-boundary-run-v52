#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/AxonOS-BCI/axonos-boundary-run-v52.git"
WORK="$HOME/axonos-boundary-run-v52"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== AxonOS Boundary Run v52 upload =="
echo "Repo: $REPO_URL"
echo "Work: $WORK"

pkg update -y || true
pkg install -y git nodejs python unzip coreutils || true

git config --global init.defaultBranch main || true

if [ -d "$WORK/.git" ]; then
  cd "$WORK"
  git remote set-url origin "$REPO_URL" || git remote add origin "$REPO_URL"
else
  rm -rf "$WORK"
  git clone "$REPO_URL" "$WORK" || { mkdir -p "$WORK"; cd "$WORK"; git init -b main; git remote add origin "$REPO_URL"; }
  cd "$WORK"
fi

# Repository is expected to be empty, but this is non-destructive for git history.
# It removes local working-tree files before copying the v52 package.
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +

cp -R "$SRC_DIR"/* "$WORK"/
rm -f "$WORK/UPLOAD_TO_GITHUB_TERMUX.sh"
chmod +x scripts/*.sh tools/*.py || true

bash scripts/verify_donation_address.sh
bash scripts/verify_no_sw.sh
node qa/boundary-run-static-smoke-v52.mjs
python3 tools/boundary_run_audit_v52.py
bash scripts/reproducibility_check.sh
bash scripts/build_web.sh dist

git add .
git commit -m "feat: launch AxonOS Boundary Run v52 Foundation Standard" || echo "No changes to commit"
git tag -f v52.0.0
git push -u origin main
git push -f origin v52.0.0

echo "DONE: pushed to $REPO_URL"
