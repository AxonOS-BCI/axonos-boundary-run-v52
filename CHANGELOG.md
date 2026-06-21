# Changelog

## v52.0.0 — Foundation Standard — 2026-06-21

### Added

- Initial public Foundation Standard release for AxonOS Boundary Run v52.
- Static playable browser game implementation.
- Ari safe-intent courier gameplay loop.
- Kibo guardian co-authorisation warning model.
- Consent FSM representation: `Granted`, `Suspended`, `Withdrawn`.
- Integrity-based failure model.
- Neural Boundary Field zone system.
- Neural Weather model.
- Local replay proof export.
- Colorblind mode toggle.
- Screen-reader live region for warnings.
- Full v52 technical specification under `docs/`.
- Traceability matrix mapping game mechanics to AxonOS architecture concepts.
- Security, governance, contributing, trademark, third-party notices, and donation documents.
- Zero-telemetry audit tooling.
- No-Service-Worker verification.
- Donation-address integrity verification.
- Reproducibility tree-hash check.
- Release packaging script and SHA-256 asset manifest generation.
- GitHub Release automation script.
- CI workflow.
- Tag-triggered release workflow.
- GitHub Pages deployment workflow.

### Security

- Runtime forbids `fetch()`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, and Service Worker registration.
- Runtime is self-contained and does not depend on external CDN assets.
- Donation address moved to `DONATIONS.md` and verified by script.

### Known limitations

- Current runtime is static JavaScript/Canvas Foundation implementation.
- Final Rust/WASM deterministic simulation core remains a roadmap target.
- Formal Kani/fuzz/WCRT proof chain is not claimed complete in this Foundation release.
