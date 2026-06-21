# AxonOS Boundary Run v52 — The Sovereign Signal

**Foundation Standard Edition.** A zero-telemetry browser game and technical reference implementation for cognitive privacy, consent boundaries, deterministic replay proofs, and AxonOS-style safety semantics.

> Protect the choice. Protect the person.

## Status

- Target release: `v52.0.0`
- Repository class: public educational game / cognitive privacy simulator
- Platform: static browser build, HTML5 Canvas, offline-first, no backend
- License: `AGPL-3.0-only OR AxonOS Commercial License`
- Specification: [`docs/AxonOS_Boundary_Run_v52_Technical_Specification.md`](docs/AxonOS_Boundary_Run_v52_Technical_Specification.md)

This repository currently contains a **static Foundation implementation** of the v52 game loop, replay proof, consent-state model, zero-network audit checks, governance files, release scaffolding, and GitHub Pages-ready build layout. The long-term v52 target is Rust → WebAssembly with fixed-point deterministic simulation.

## Game concept

Ari is a safe-intent courier moving through the Neural Boundary Field. Kibo is a guardian co-authorisation mechanism, not a chatbot. Every zone is a policy decision:

| Game element | AxonOS mapping |
| --- | --- |
| Ari | Safe-intent observation |
| Kibo | Guardian co-authorisation |
| Consent Gates | Granted → Suspended → Withdrawn FSM |
| Raw Signal Zone | Simulated structural-privacy violation |
| Audit Lane | Reproducible evidence and traceability |
| Sealed Vault | Privacy-vault enforcement |
| Quarantine | Safe failure state |

## Run locally

```bash
python3 -m http.server 8080
# open http://127.0.0.1:8080
```

No server logic is required. The game is static and self-contained.

## Controls

- Move: `A/D` or `←/→`
- Jump: `W`, `↑`, or `Space`
- Duck: `S` or `↓`
- Pause: `P`
- Revoke consent: `R`
- Resume after suspension: `E`
- Export proof: button in UI

Mobile touch controls are included.

## Security posture

Boundary Run v52 is designed as a zero-telemetry educational artifact:

- No `fetch()`
- No `XMLHttpRequest`
- No `WebSocket`
- No `navigator.sendBeacon`
- No analytics
- No external CDN assets
- No service worker
- Local-only replay proof export

Run the audit:

```bash
python3 tools/boundary_run_audit_v52.py
node qa/boundary-run-static-smoke-v52.mjs
bash scripts/verify_no_sw.sh
bash scripts/verify_donation_address.sh
```

## Build

```bash
bash scripts/build_web.sh dist
```

This copies the static build into `dist/` and computes `SOURCE_MANIFEST.sha256`.

## GitHub Pages

Set GitHub Pages to deploy from `main` / root, or use the included Actions workflow artifact.

## License

Boundary Run v52 is dual-licensed at your option under:

- **AGPL-3.0-only** for open-source distribution
- **AxonOS Commercial License** for closed-source/commercial use

See [`LICENSE-AGPL`](LICENSE-AGPL), [`LICENSE-COMMERCIAL`](LICENSE-COMMERCIAL), and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

The AxonOS name and logo are trademarks of the AxonOS Project. Use of the trademark requires compliance with [`TRADEMARK.md`](TRADEMARK.md).
