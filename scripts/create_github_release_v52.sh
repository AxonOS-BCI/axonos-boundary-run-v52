#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail

REPO="AxonOS-BCI/axonos-boundary-run-v52"
VERSION="$(cat VERSION | tr -d '[:space:]')"
TAG="v${VERSION}"
TITLE="AxonOS Boundary Run ${VERSION} — The Sovereign Signal"
NOTES="RELEASE_NOTES_v52.0.0.md"

if ! command -v gh >/dev/null 2>&1; then
  echo "FAIL: GitHub CLI 'gh' is required. Install it manually, then run: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "FAIL: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ERROR: Tag $TAG already exists locally. Refusing to overwrite release history."
  exit 1
fi

if git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "ERROR: Tag $TAG already exists on remote. Refusing to overwrite release history."
  exit 1
fi

bash scripts/package_release.sh

git add .
git commit -m "release: AxonOS Boundary Run ${TAG} Foundation Standard" || echo "No source changes to commit"
git push -u origin main

git tag -a "$TAG" -m "AxonOS Boundary Run ${TAG} — Foundation Standard"
git push origin "$TAG"

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
