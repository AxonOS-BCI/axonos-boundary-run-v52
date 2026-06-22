# Traceability Matrix: Game Mechanics → AxonOS Architecture

| Game Mechanic | AxonOS Concept | Evidence Target | Implementation File |
| --- | --- | --- | --- |
| Consent Gates | Consent FSM: Granted → Suspended → Withdrawn | L1-style state reasoning | `src/game.js` |
| Ari | Safe-intent observation | L2 replay trace | `src/game.js` |
| Kibo | Guardian co-authorisation | Dual-control resume semantics | `src/game.js` |
| Raw Signal Zone | Simulated structural privacy violation | Educational only | `src/game.js` |
| Audit Lane | Full audit trail | Replay proof export | `src/game.js` |
| Sealed Vault | Privacy vault boundary | Integrity regeneration | `src/game.js` |
| Quarantine/Suspension | Safe failure state | Consent reduction | `src/game.js` |
| Replay Proof | Deterministic audit trace | SHA-256 proof payload | `src/game.js`, `tools/boundary_run_verify_v3.py` |


## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.
