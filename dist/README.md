# AxonOS Boundary Run v52 — The Sovereign Signal

<p align="center">
  <img src="https://img.shields.io/badge/build-CI-2ea44f" alt="CI" />
  <img src="https://img.shields.io/badge/license-AGPL--3.0--only%20OR%20Commercial-blue" alt="License" />
  <img src="https://img.shields.io/badge/replay-deterministic%20%C2%B7%20SHA--256%20verified-2ea44f" alt="Deterministic replay proof" />
  <img src="https://img.shields.io/badge/telemetry-none-555" alt="Zero telemetry" />
  <img src="https://img.shields.io/badge/runtime-offline%20%C2%B7%20no%20CDN-555" alt="Offline, no CDN" />
</p>

<p align="center">
  <a href="https://axonos-bci.github.io/axonos-boundary-run-v52/"><strong>▶ Launch Game</strong></a>
  ·
  <a href="https://github.com/AxonOS-BCI/axonos-boundary-run-v52/releases/tag/v52.0.0"><strong>Download Release</strong></a>
  ·
  <a href="docs/AxonOS_Boundary_Run_v52_Technical_Specification.md"><strong>Read Specification</strong></a>
</p>

**Foundation Standard Edition.** A zero-telemetry browser game and technical reference implementation for cognitive privacy, consent boundaries, deterministic replay proofs, and AxonOS-style safety semantics.

> Protect the choice. Protect the person.

## Launch directly from README

[▶ Play AxonOS Boundary Run v52](https://axonos-bci.github.io/axonos-boundary-run-v52/)

Fallback local launch:

```bash
python3 -m http.server 8080
# open http://127.0.0.1:8080
```

## Direct Donation Wallet

Support AxonOS Boundary Run v52 directly. The wallet is stored directly in this repository and verified by CI.

```text
Dogecoin: DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp
```

## Attribution

- **Creator / Founder / Maintainer:** Denis Yermakou
- **Project:** AxonOS Boundary Run v52 — The Sovereign Signal
- **Organization:** AxonOS
- **Website:** https://axonos.org
- **Repository:** https://github.com/AxonOS-BCI/axonos-boundary-run-v52
- **Playable build:** https://axonos-bci.github.io/axonos-boundary-run-v52/

Required attribution string:

```text
Created by Denis Yermakou, Founder & CEO of AxonOS.
```

## Implementation Status

- Target release: `v52.0.0`
- Repository class: public educational game / cognitive privacy simulator
- Platform: static browser build, HTML5 Canvas, offline-first, no backend
- License: `AGPL-3.0-only OR LicenseRef-AxonOS-Commercial`
- Specification: [`docs/AxonOS_Boundary_Run_v52_Technical_Specification.md`](docs/AxonOS_Boundary_Run_v52_Technical_Specification.md)
- Attribution: [`ATTRIBUTION.md`](ATTRIBUTION.md)
- Live game: [https://axonos-bci.github.io/axonos-boundary-run-v52/](https://axonos-bci.github.io/axonos-boundary-run-v52/)

This repository contains a **playable static implementation** of the v52 game: a deterministic, fixed-timestep game loop with a self-verifying replay proof, a consent-state model, zero-network audit checks, governance files, release scaffolding, a GitHub Pages build layout, and creator attribution for **Denis Yermakou**. A Rust → WebAssembly port with fixed-point arithmetic is a future hardening step; the current JavaScript core is already deterministic and replay-verifiable across languages (see *Determinism & replay proof*).

## Game concept

You are the **Sovereign Signal** moving through the Neural Boundary Field. Kibo is a guardian co-authorisation voice (the status messages), not a chatbot. Every element maps to an AxonOS boundary concept:

| Game element | AxonOS mapping |
| --- | --- |
| The Sovereign Signal (you) | Safe-intent observation under consent |
| Kibo (status messages) | Guardian co-authorisation |
| Consent state | Granted → Suspended → Withdrawn FSM |
| Red Raw-Signal spike | Simulated structural-privacy violation |
| Purple Artifact | Intent-fidelity degradation |
| Gray Gate | Stale consent → temporary suspension |
| Gold Sealed Vault | Privacy-vault enforcement (reward) |
| Green Audit band | Reproducible evidence / integrity restore |
| Amber Fast band | Higher throughput, higher exposure |

## How to play

- **Move (keyboard):** `← → ↑ ↓` or `WASD` (A/D, W/S) — free 2-D movement, no gravity, so you can hold any position.
- **Dash:** `Shift` or `K` — a short burst with brief invulnerability to phase through danger; on a cooldown. On touch, two-finger tap.
- **Move (touch):** drag anywhere on the play area; the signal follows your finger.
- **Goal:** dodge red Raw-Signal spikes (−18 integrity) and purple Artifacts (−7); slip past closely for a near-miss bonus. Collect gold Vaults for integrity, score and combo streaks. Gray Gates suspend consent for ~3 s. Hazards drift vertically, and periodic **surge waves** raise the pressure.
- **Bands:** ride the green **Audit** band to restore integrity; the amber **Fast** band doubles score but slowly drains it.
- **Pause:** `P` or button. **Start / Restart:** button or `Enter`. **Export Replay Proof:** button.

Consent suspension and run-end are automatic consequences of play — there are no instant-quit keys.

## Determinism & replay proof

The gameplay core runs on a **fixed 60 Hz timestep**, decoupled from the display refresh rate, and draws all randomness from a single seeded RNG whose state lives in the run. The same seed and input log therefore reproduce the same final state and the same canonical SHA-256 hash — on any machine, at any frame rate.

The exported proof records the seed and the full input log, and the engine re-simulates it on export to set `verified`. Because the core is a language-independent specification, the proof can be re-checked outside the browser:

```bash
# verify an exported proof by independent Python re-simulation
python3 tools/boundary_run_verify_v3.py boundary-run-v52-proof-XXXXXXXX.json
```

If the re-simulated hash matches `proof.hash`, the run is authentic. Visual effects (particles, screen shake) are cosmetic and never affect the hash.

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

Set GitHub Pages to deploy with GitHub Actions. The included Pages workflow builds `dist/` and deploys the static browser game.

## Release

Current release: **v52.0.0 — The Sovereign Signal**.

Release package generation:

```bash
bash scripts/package_release.sh
```

Publish/update the GitHub Release:

```bash
bash scripts/create_github_release_v52.sh
```

Release notes: [`RELEASE_NOTES_v52.0.0.md`](RELEASE_NOTES_v52.0.0.md).


## License

Boundary Run v52 is dual-licensed at your option under:

- **AGPL-3.0-only** for open-source distribution
- **AxonOS Commercial License** for closed-source/commercial use

See [`LICENSE-AGPL`](LICENSE-AGPL), [`LICENSE-COMMERCIAL`](LICENSE-COMMERCIAL), [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), and [`ATTRIBUTION.md`](ATTRIBUTION.md).

The AxonOS name and logo are trademarks of the AxonOS Project. Use of the trademark requires compliance with [`TRADEMARK.md`](TRADEMARK.md).
