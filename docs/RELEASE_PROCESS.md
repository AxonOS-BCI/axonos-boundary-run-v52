# Release Process: AxonOS Boundary Run v52

This repository uses a simple release discipline:

1. Verify the working tree.
2. Run static security checks.
3. Build the static distribution.
4. Package source and distribution assets.
5. Generate SHA-256 checksums.
6. Push `main`.
7. Create or update the signed release tag.
8. Publish a GitHub Release with assets.
9. Confirm GitHub Pages deployment.

## Local verification

```bash
node qa/boundary-run-static-smoke-v52.mjs
python3 tools/boundary_run_audit_v52.py
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
bash scripts/reproducibility_check.sh
bash scripts/build_web.sh dist
bash scripts/package_release.sh
```

## GitHub Release

```bash
bash scripts/create_github_release_v52.sh
```

The script uses GitHub CLI (`gh`). On Termux, install it with:

```bash
pkg install gh
```

Then authenticate:

```bash
gh auth login
```

## Tag

Current release tag:

```text
v52.0.0
```

## GitHub Pages

The Pages workflow builds `dist/` and deploys it as a static site. In repository settings, GitHub Pages should be configured to use GitHub Actions.
