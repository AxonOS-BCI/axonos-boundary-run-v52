# AxonOS Boundary Run v52 — The Sovereign Signal

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

## Status

- Target release: `v52.0.0`
- Repository class: public educational game / cognitive privacy simulator
- Platform: static browser build, HTML5 Canvas, offline-first, no backend
- License: `AGPL-3.0-only OR AxonOS Commercial License`
- Specification: [`docs/AxonOS_Boundary_Run_v52_Technical_Specification.md`](docs/AxonOS_Boundary_Run_v52_Technical_Specification.md)
- Attribution: [`ATTRIBUTION.md`](ATTRIBUTION.md)
- Live game: [https://axonos-bci.github.io/axonos-boundary-run-v52/](https://axonos-bci.github.io/axonos-boundary-run-v52/)

This repository currently contains a **static Foundation implementation** of the v52 game loop, replay proof, consent-state model, zero-network audit checks, governance files, release scaffolding, GitHub Pages-ready build layout, and creator attribution for **Denis Yermakou**. The long-term v52 target is Rust → WebAssembly with fixed-point deterministic simulation.

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
