#!/usr/bin/env bash
set -euo pipefail

REPO="AxonOS-BCI/axonos-boundary-run-v52"
VERSION="$(cat VERSION | tr -d '[:space:]')"
TAG="v${VERSION}"
TITLE="AxonOS Boundary Run ${VERSION} — The Sovereign Signal"
NOTES="RELEASE_NOTES_v52.0.0.md"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI 'gh' is not installed."
  if command -v pkg >/dev/null 2>&1; then
    pkg install -y gh || true
  fi
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "FAIL: install GitHub CLI first: pkg install gh"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated. Login now."
  gh auth login
fi

bash scripts/package_release.sh

git add .
git commit -m "release: AxonOS Boundary Run ${TAG} Foundation Standard" || echo "No source changes to commit"
git push -u origin main

git tag -fa "$TAG" -m "AxonOS Boundary Run ${TAG} — Foundation Standard"
git push -f origin "$TAG"

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  gh release upload "$TAG" release-assets/* --repo "$REPO" --clobber
  gh release edit "$TAG" --repo "$REPO" --title "$TITLE" --notes-file "$NOTES" --latest
else
  gh release create "$TAG" release-assets/* \
    --repo "$REPO" \
    --title "$TITLE" \
    --notes-file "$NOTES" \
    --latest
fi

echo "DONE: GitHub Release published: ${TAG}"
