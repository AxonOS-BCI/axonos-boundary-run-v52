# AxonOS Boundary Run v52.0.0 — Foundation Standard Edition

**Codename:** The Sovereign Signal  
**Release date:** 2026-06-21  
**Repository:** `AxonOS-BCI/axonos-boundary-run-v52`  
**Release class:** Public educational game / cognitive privacy simulator  
**License:** `AGPL-3.0-only OR AxonOS Commercial License`

> Protect the choice. Protect the person.

## Executive release summary

Boundary Run v52.0.0 is the first Foundation Standard release of the AxonOS Boundary Run line. It packages a playable static browser implementation, a release-grade documentation set, zero-telemetry verification scripts, deterministic replay proof export, governance files, trademark scope, security posture, and CI/CD scaffolding for a public GitHub release.

This release is intentionally conservative: it does not claim to be the final Rust/WASM implementation described in the v52 technical target. Instead, it establishes the public repository baseline, the educational mechanics, the compliance posture, and the release machinery required to evolve toward the full Rust → WebAssembly deterministic simulator.

## What this release contains

### Playable Foundation build

- Static HTML5 Canvas game loop.
- Ari safe-intent courier mechanic.
- Kibo guardian co-authorisation warnings.
- Consent state model: `Granted`, `Suspended`, `Withdrawn`.
- Integrity-based failure instead of conventional HP.
- Neural Boundary Field zones: Safe Lane, Audit Lane, Fast Lane, Raw Signal, Consent Gate, Stimulation Beam, Sealed Vault.
- Neural Weather model: Clear, Overcast, Storm, Solar Flare, Quantum Calm.
- Local replay proof export.
- Colorblind mode toggle.
- Screen-reader live region for Kibo/system warnings.

### Security and privacy posture

- Zero backend.
- Zero telemetry.
- No analytics.
- No external CDN runtime dependency.
- No `fetch()`.
- No `XMLHttpRequest`.
- No `WebSocket`.
- No `navigator.sendBeacon`.
- No Service Worker.
- Local-only proof export.
- Donation-address integrity verification.

### Release engineering

- `scripts/build_web.sh` — builds the static distribution into `dist/`.
- `scripts/reproducibility_check.sh` — checks deterministic output tree hashing.
- `scripts/verify_no_sw.sh` — blocks service-worker introduction.
- `scripts/verify_donation_address.sh` — checks DOGE donation-address integrity.
- `scripts/package_release.sh` — builds release assets and checksums.
- `scripts/create_github_release_v52.sh` — creates/updates GitHub Release via GitHub CLI.
- `.github/workflows/ci.yml` — CI verification for every push/PR.
- `.github/workflows/release.yml` — tag-triggered release packaging workflow.
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow for the static build.

### Documentation and governance

- `README.md` — public project front door.
- `docs/AxonOS_Boundary_Run_v52_Technical_Specification.md` — full v52 specification.
- `docs/TRACEABILITY_MATRIX.md` — game mechanics mapped to AxonOS concepts.
- `docs/RELEASE_PROCESS.md` — operator release procedure.
- `SECURITY.md` — coordinated disclosure policy.
- `CONTRIBUTING.md` — contribution discipline and cognitive-data safety rule.
- `GOVERNANCE.md` — project governance baseline.
- `TRADEMARK.md` — AxonOS trademark scope.
- `THIRD_PARTY_NOTICES.md` — dependency/notice baseline.
- `DONATIONS.md` — donation address stored outside the README.

## Verification commands

```bash
node qa/boundary-run-static-smoke-v52.mjs
python3 tools/boundary_run_audit_v52.py
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
bash scripts/reproducibility_check.sh
bash scripts/package_release.sh
```

## Release assets

The release packaging script generates:

- `release-assets/axonos-boundary-run-v52.0.0-dist.zip`
- `release-assets/axonos-boundary-run-v52.0.0-source.zip`
- `release-assets/axonos-boundary-run-v52.0.0-source.tar.gz`
- `release-assets/SHA256SUMS.txt`
- `release-assets/RELEASE_NOTES_v52.0.0.md`

## Technical status

| Area | v52.0.0 status |
| --- | --- |
| Static browser playability | Complete Foundation build |
| Zero-telemetry audit | Implemented |
| No-Service-Worker posture | Implemented |
| Donation-address integrity check | Implemented |
| Replay proof export | Implemented as browser-side structural proof |
| CI smoke/audit/build | Implemented |
| GitHub Release automation | Implemented |
| GitHub Pages deployment workflow | Implemented |
| Rust/WASM deterministic core | Roadmap target, not claimed as complete |
| Kani/fuzz/WCRT proof chain | Roadmap target, not claimed as complete |

## Known limitations

- The current playable layer is JavaScript/Canvas, not yet the final Rust/WASM simulation core.
- Replay verification is structural in this release; byte-exact deterministic replay is the next proof-system milestone.
- The full formal verification stack is not included in v52.0.0 Foundation.
- The security checks are static and conservative; they do not replace a full third-party audit.

## Operator note

This is the correct release to publish to the currently empty `AxonOS-BCI/axonos-boundary-run-v52` repository as the first public baseline. Use tag:

```bash
v52.0.0
```

Recommended GitHub Release title:

```text
AxonOS Boundary Run v52.0.0 — The Sovereign Signal
```
