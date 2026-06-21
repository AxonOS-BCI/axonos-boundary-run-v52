# Technical Specification: AxonOS Boundary Run v52
## "The Sovereign Signal" — High-End AxonOS Foundation Standard Edition

**Document Version:** 1.0.0-FINAL  
**Creator / Founder:** Denis Yermakou  
**Classification:** Open Specification — CC-BY-SA-4.0  
**Date:** 2026-06-21  
**Target Release:** v52.0.0 (Foundation Standard)  
**Game Genre:** Serious Educational Browser Game / Cognitive Privacy Simulator  
**Platform:** Static Browser Build (WebAssembly + HTML5 Canvas)  
**License:** AGPL-3.0-only OR AxonOS Commercial License  

---

## 1. EXECUTIVE SUMMARY

Boundary Run v52 is the definitive educational game encapsulating the full architectural depth of the AxonOS brain-computer interface operating system. It is not merely a game—it is an interactive, byte-for-byte reproducible specification of cognitive privacy, consent architecture, real-time safety guarantees, and structural privacy-by-design.

**Primary Design Principle:** *Every game mechanic must map 1:1 to an AxonOS kernel concept, RFC, or safety guarantee. If it cannot be traced to the kernel, the consent protocol, or the validation framework, it does not belong in v52.*

**Educational Mission:** Teach players—ranging from BCI engineers to clinical ethicists to privacy advocates—the operational reality of a safety-critical neural OS through embodied, consequential gameplay.

---

## 2. CORE DESIGN PHILOSOPHY

### 2.1 The Quintessence of AxonOS

AxonOS is defined by four non-negotiable commitments citeweb_search:2#5:

1. **Hard Real-Time on Commodity Hardware:** `#![no_std]` Rust, ARM Cortex-M, zero GC, zero allocator on hot path, zero unbounded panics.
2. **Formally Bounded WCRT:** Every critical-path operation has a Kani-verified upper bound. Latency is *proven*, not benchmarked.
3. **Structural Privacy:** Capabilities that leak raw cognitive state (`RawEEG`, `EmotionState`, `CognitiveProfile`) do not exist in the type system. Misuse is a compile error.
4. **Open Ecosystem:** Apache-2.0 OR MIT for code, CC-BY-SA-4.0 for specifications. Every repository public. Anyone can audit, fork, or replace any layer.

### 2.2 Game-to-Architecture Mapping

| Game Element | AxonOS Real-World Concept | RFC / Standard Reference |
|-------------|--------------------------|-------------------------|
| **Ari (the courier)** | Safe-intent observation (`IntentObservation`) | RFC-0006 wire format citeweb_search:3#1 |
| **Neural Boundary Field** | Application boundary + capability gate | RFC-0005 capability manifest citeweb_search:3#1 |
| **Kibo (guardian companion)** | Guardian co-authorisation (`DualControlMachine`) | axonos-consent v0.5.0 SPEC §12 citeweb_search:3#1 |
| **Consent Gates** | Consent FSM states (`Granted` → `Suspended` → `Withdrawn`) | axonos-consent state machine citeweb_search:3#1 |
| **Artifact Spikes** | Signal conditioning / artifact rejection (DSP layer) | AxonOS Standard §6 (planned) citeweb_search:2#5 |
| **Stimulation Beams** | Unsafe stimulation / StimGuard enforcement | AxonOS Standard — safety case (planned) citeweb_search:2#5 |
| **Delivery Contracts** | Capability-based application manifests | RFC-0005 citeweb_search:3#1 |
| **Replay Proof** | Deterministic reproducibility / audit traces | RFC-0003 Validation Status Framework (L1/L2/L3) citeweb_search:3#5 |
| **Neural Weather** | Real-time signal quality indicators | axonos-validation L2 traces citeweb_search:2#5 |
| **Sealed Vault** | Privacy-vault enforcement (raw data never crosses boundary) | Structural privacy commitment citeweb_search:2#5 |
| **Quarantine** | Safe failure state / kernel panic recovery | axonos-kernel safe failure state citeweb_search:2#5 |
| **Audit Lane** | Full audit trail / reproducible evidence | RFC-0003 L3 evidence citeweb_search:3#5 |

---

## 3. ARCHITECTURE OVERVIEW

### 3.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  HTML5 Canvas 2D / WebGL (fallback) + Web Audio API         │
│  Responsive: Desktop (keyboard) + Mobile (touch/swipe)       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    SIMULATION LAYER                          │
│  Rust → WebAssembly (WASM) — deterministic, no_std ethics  │
│  - Seeded RNG (ChaCha20-based, RFC-0006 entropy model)      │
│  - Fixed-point physics (Q16.16) — no float nondeterminism  │
│  - Consent FSM (byte-exact with axonos-consent)             │
│  - Capability manifest validator                             │
│  - Replay encoder (SHA-256 deterministic proof)             │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                         │
│  localStorage (encrypted-at-rest with AES-256-GCM)          │
│  - Zero server communication                                  │
│  - Zero telemetry                                             │
│  - Exportable audit logs (JSON + SHA-256 checksum)          │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Determinism Contract

**CRITICAL:** The v52 simulation layer must be *byte-for-byte reproducible* across:
- Different browsers (Chrome, Firefox, Safari, Edge)
- Different operating systems (Windows, macOS, Linux, Android, iOS)
- Different architectures (x86_64, ARM64, WASM32)

**Enforcement:**
- All RNG uses seeded ChaCha20 (deterministic stream)
- All physics uses fixed-point arithmetic (Q16.16)
- All timing uses frame-count, not wall-clock
- All state transitions are logged in a Merkle tree
- Replay proof: SHA-256 hash of initial seed + all player inputs + final state

---

## 4. GAME MECHANICS SPECIFICATION

### 4.1 Player Character: Ari

**Role:** Safe-intent courier. Ari does not carry thoughts—Ari carries *choices*.

**Mechanics:**
- **Movement:** Left/right (A/D or ←/→), Jump (↑/W), Duck (↓/S)
- **Momentum:** Fixed-point velocity with deceleration (simulates real-time scheduling inertia)
- **Health:** Not HP—*Integrity*. Integrity represents the fidelity of the intent observation. Starts at 1.0 (Q0.16 fixed-point: 65535). Decays on raw signal exposure, artifact collision, or consent violation.
- **Death Condition:** Integrity reaches 0 OR consent state reaches `Withdrawn` (terminal, irreversible).

### 4.2 Companion: Kibo

**Role:** Guardian co-authorisation agent. Kibo is not an AI assistant—Kibo is a *policy enforcement mechanism*.

**Mechanics:**
- **Warning System:** Kibo emits typed alerts corresponding to AxonOS capability classes:
  - `Navigation` → Path obstruction warnings
  - `SessionQuality` → Signal degradation warnings
  - `Stimulation` → Unsafe beam proximity warnings
  - `Audit` → Compliance drift warnings
- **Co-Authorisation:** In "Clinical Mode" (dual-control), Kibo can *unilaterally* suspend or withdraw consent. Resuming requires *both* player and Kibo approval within a bounded window (10-second timeout, matching axonos-consent v0.5.0 SPEC §12) citeweb_search:3#1.

### 4.3 The Neural Boundary Field

**Concept:** The game world IS the application boundary. Every pixel is a policy decision.

**Zone Types:**

| Zone | Visual | Gameplay Effect | AxonOS Mapping |
|------|--------|----------------|----------------|
| **Safe Lane** | Cyan gradient | Normal movement, no integrity loss | `Capability::Navigation` granted |
| **Fast Lane** | Amber streaks | 2x speed, 0.5x integrity decay rate | `Capability::SessionQuality` — high throughput, lower fidelity |
| **Audit Lane** | Green grid | 0.5x speed, full audit logging, integrity regenerates | `Capability::Audit` — maximum traceability |
| **Raw Signal Zone** | Red static | Rapid integrity loss (simulates `RawEEG` exposure—structurally impossible in real AxonOS, but simulated as *what-if*) | Hypothetical violation — teaches why `RawEEG` doesn't exist as a type citeweb_search:2#5 |
| **Stale Consent Gate** | Grey barrier | Blocks passage until consent is re-validated | Consent FSM `Suspended` state citeweb_search:3#1 |
| **Revoked Terminal** | Black void | Instant game over, irreversible | Consent FSM `Withdrawn` state — terminal, requires fresh manifest install citeweb_search:3#1 |
| **Artifact Spike** | Purple jagged | Stuns player, randomizes input for 2 seconds | Signal artifact / DSP failure |
| **Stimulation Beam** | Yellow laser | Forces movement in beam direction (coercion simulation) | Unsafe stimulation — StimGuard violation |
| **Sealed Vault** | Gold shimmer | Absolute safe zone, zero integrity loss, no data passes boundary | Privacy-vault enforcement layer citeweb_search:2#5 |
| **Quarantine Zone** | Orange mesh | Player is isolated, cannot interact with field, but safe | Safe failure state / kernel panic recovery citeweb_search:2#5 |

### 4.4 Delivery Contracts (Level Objectives)

Each level is a *Delivery Contract*—a capability manifest that defines what Ari is allowed to do and what the boundary guarantees.

**Contract Types:**

1. **Zero Trust:** Every gate requires explicit re-consent. No implicit grants.
2. **Minimal Surface:** Only `Navigation` capability is granted. No `SessionQuality`, no `Audit`.
3. **No Throttle:** No rate-limiting on intent observations. Maximum throughput, maximum risk.
4. **Full Audit:** Every state transition logged. Integrity regenerates in Audit Lane. Final score includes audit completeness.
5. **Sealed Envelope:** The destination is unknown until arrival. No intermediate data leakage. Simulates end-to-end encryption of intent observations.

### 4.5 Neural Weather System

**Concept:** Real-time signal quality indicators that affect level generation and hazard density.

**Weather States:**
- **Clear:** Standard difficulty, standard artifact density.
- **Overcast:** +20% artifact spikes, -10% integrity regeneration.
- **Storm:** +50% artifact spikes, random consent gate staleness, stimulation beams activate.
- **Solar Flare:** Raw signal zones appear (educational: "This cannot happen in real AxonOS because `RawEEG` is not a type").
- **Quantum Calm:** All zones become Sealed Vaults for 10 seconds. Deterministic RNG enters known-good state.

**Determinism:** Weather is seeded by level seed + day-of-year (daily challenge mode). Same seed = same weather sequence.

### 4.6 Moral Branch Choices

At each checkpoint, the player chooses a lane. This is not difficulty selection—this is *policy selection*.

| Choice | Immediate Effect | Long-term Consequence | Educational Lesson |
|--------|-----------------|----------------------|-------------------|
| **Fast Lane** | Speed bonus, score multiplier | Higher artifact exposure, audit trail gaps | Throughput vs. fidelity tradeoff |
| **Safe Lane** | No speed bonus, full integrity | Perfect audit trail, maximum score potential | Conservative policy wins in safety-critical systems |
| **Audit Lane** | Speed penalty, full logging | Bonus for audit completeness, unlocks "Regulator" ending | Transparency is a capability, not a burden |

### 4.7 Replay Proof v3 (Enhanced over v9)

**Requirement:** Every playthrough must be cryptographically provable and reproducible.

**Implementation:**
1. **Seed:** 256-bit ChaCha20 seed derived from `SHA-256(player_name + timestamp + daily_salt)`
2. **Input Log:** Every frame (60fps) records: `[frame_number, input_state, integrity_Q16, consent_state]`
3. **Merkle Tree:** Input log committed to Merkle tree, root hash displayed at end of run
4. **Final Portrait:** Procedurally generated from final state hash. Same final state = same portrait (deterministic).
5. **Copy Proof:** One-click copy of: seed + Merkle root + final hash + portrait SVG
6. **Verification:** External tool (`tools/boundary_run_verify_v3.py`) can replay any log and verify hash chain

---

## 5. EDUCATIONAL CONTENT INTEGRATION

### 5.1 In-Game Codex: "The AxonOS Manual"

Unlockable entries that teach real AxonOS concepts:

| Unlock Condition | Codex Entry | Real Source |
|-----------------|-------------|-------------|
| Complete Tutorial | "What is an IntentObservation?" | RFC-0006: 32-byte wire record, Q0.16 confidence citeweb_search:3#1 |
| First Consent Gate | "The Consent State Machine" | axonos-consent: Granted → Suspended → Withdrawn citeweb_search:3#1 |
| First Artifact Spike | "Why We Don't Trust Raw Signals" | AxonOS Standard: DSP layer is planned, not live citeweb_search:2#5 |
| First Stimulation Beam | "StimGuard: The Anti-Coercion Layer" | AxonOS Standard — safety case (planned) citeweb_search:2#5 |
| Complete "Zero Trust" contract | "Capability Manifests: Least Privilege by Design" | RFC-0005: Application declares needs at compile time citeweb_search:3#1 |
| Complete "Full Audit" contract | "L1, L2, L3: Evidence Levels in AxonOS" | RFC-0003: Validation Status Framework citeweb_search:3#5 |
| Witness Kibo withdraw consent | "Guardian Co-Authorisation: The Safe-Direction Principle" | axonos-consent v0.5.0 SPEC §12: Either party may reduce exposure unilaterally citeweb_search:3#1 |
| Reach "Withdrawn" terminal | "Why Withdrawn is Terminal" | axonos-consent: Non-reversibility is the central anti-coercion property citeweb_search:3#1 |
| Complete Daily Challenge | "Kani: Proving Latency, Not Benchmarking It" | 28 Kani harnesses, WCRT ≤1000µs proven citeweb_search:2#5 |
| Complete All Contracts | "The Seven Layers of AxonOS" | AxonOS 7-Layer Intelligence Model citeweb_search:2#2 |

### 5.2 Scenario Mode: "Clinical Ethics Simulator"

Narrative-driven scenarios based on real BCI ethics dilemmas:

1. **"The ALS Patient"**: Patient can only communicate via BCI. Guardian (spouse) has co-authorisation. Patient wants to send a message. Guardian disagrees. What does Kibo do? *(Answer: Safe-direction principle—either party can suspend, but resuming requires both.)* citeweb_search:3#1
2. **"The Researcher"**: Scientist wants `SessionQuality` data for paper. Patient wants `Navigation` only. Contract negotiation mechanic.
3. **"The Emergency"**: Patient's BCI shows seizure precursor. System must enter `Quarantine` (safe failure) without violating consent. Teach safe failure states.
4. **"The Upgrade"**: New kernel version available. Requires fresh manifest install (like `Withdrawn` → new install). Patient must re-consent to all capabilities.

---

## 6. TECHNICAL IMPLEMENTATION SPECIFICATION

### 6.1 Build System

```bash
# Build pipeline (must be reproducible)
bash scripts/build_web_v52.sh dist
# Outputs:
#   dist/index.html
#   dist/boundary_run_v52.wasm
#   dist/boundary_run_v52.js (glue)
#   dist/assets/ (sprites, audio, fonts)
#   dist/manifest.json (PWA metadata)

# Verification pipeline
python3 tools/boundary_run_audit_v52.py    # L2 evidence generation
node qa/boundary-run-static-smoke-v52.mjs  # Static analysis smoke test
bash scripts/reproducibility_check.sh        # Byte-for-byte WASM comparison
```

### 6.2 Security Requirements

| Threat | Mitigation | Verification |
|--------|-----------|--------------|
| **Telemetry injection** | No `fetch()`, `XMLHttpRequest`, `WebSocket`, or `navigator.sendBeacon` in source | Static analysis + manual audit |
| **localStorage poisoning** | AES-256-GCM encryption of all saved data, key derived from session | crypto audit |
| **RNG manipulation** | ChaCha20 seeded from `crypto.getRandomValues()` + player salt | Determinism test vectors |
| **WASM tampering** | Reproducible build: same source → same WASM hash | CI reproducibility check |
| **XSS via save data** | All save data is binary (Uint8Array), never interpreted as HTML/JS | Fuzz testing |
| **Consent bypass** | Consent FSM is WASM-side, not JS-side; JS cannot override | Code review + Kani-style reasoning |
| **Stimulation coercion** | StimGuard mechanic is hardcoded in WASM; no runtime toggle | Static analysis |

### 6.3 Performance Budget

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Frame time** | ≤16.67ms (60fps) | Real-time feel |
| **WASM binary size** | ≤500KB (gzipped) | Fast load, low bandwidth |
| **Total asset size** | ≤2MB | Mobile-friendly |
| **First paint** | ≤1.5s | Engagement threshold |
| **Time to interactive** | ≤3s | Accessibility |
| **Memory footprint** | ≤64MB | Low-end device support |
| **Input latency** | ≤2 frames (≤33ms) | Responsive controls |

### 6.4 Accessibility (A11y)

- **Screen reader support:** All UI elements have ARIA labels. Kibo's warnings are text + audio.
- **Colorblind mode:** Patterns replace color coding for all zones.
- **Motor accessibility:** Full keyboard control, adjustable game speed (0.5x–2x), pause-anytime.
- **Cognitive accessibility:** Tutorial is skippable but strongly recommended. Codex entries are readable offline.
- **Seizure safety:** No flashing above 3Hz. Artifact spikes have reduced visual intensity option.

---

## 7. CI/CD & RELEASE READINESS

### 7.1 Continuous Integration Pipeline

```yaml
# .github/workflows/ci-v52.yml
jobs:
  fmt:
    - rustfmt --check
    - prettier --check
  clippy:
    - cargo clippy --target wasm32-unknown-unknown -- -D warnings
  test:
    - cargo test (native)
    - wasm-pack test --headless --firefox
    - wasm-pack test --headless --chrome
  no_std_build:
    - cargo build --target wasm32-unknown-unknown --no-default-features
  docs:
    - cargo doc --no-deps
    - mdbook build (for educational content)
  license:
    - cargo deny check licenses
    - fossa scan
  fuzz:
    - cargo fuzz run wire_decode (30 min)
    - cargo fuzz run fsm_sequence (30 min)
  reproducibility:
    - build WASM → hash A
    - clean → build WASM → hash B
    - assert hash_A == hash_B
  smoke:
    - node qa/boundary-run-static-smoke-v52.mjs
  audit:
    - python3 tools/boundary_run_audit_v52.py
```

### 7.2 Release Checklist

- [ ] All 8 RFCs mapped to game mechanics with traceability matrix
- [ ] All 28 Kani harness concepts represented in educational content
- [ ] Reproducibility check passes on 3 different CI runners
- [ ] Static analysis confirms zero network calls
- [ ] Fuzz suite runs 12+ hours with zero crashes
- [ ] Accessibility audit passes WCAG 2.1 AA
- [ ] License compliance: all dependencies Apache-2.0/MIT compatible
- [ ] Security disclosure policy published (security@axonos.org, 90-day coordinated disclosure) citeweb_search:2#5
- [ ] Commercial license terms finalized (AGPL-3.0-only OR AxonOS Commercial)
- [ ] Trademark policy compliance verified (NOTICE file, attribution) citeweb_search:3#1
- [ ] Community translation strings ready for 8 languages (EN, JP, CN, IT, FR, DE, ES, AR) citeweb_search:2#5

---

## 8. EDGE CASES & FAILURE MODES

### 8.1 Determinism Edge Cases

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Browser float behavior differences | WASM float ops may differ by 1 ULP | Use fixed-point Q16.16 for all game logic |
| `Date.now()` nondeterminism | Daily seed depends on date | Use UTC midnight, not local time |
| `Math.random()` temptation | Developer might use JS RNG | Lint rule: `Math.random` is forbidden; ChaCha20 only |
| Audio buffer size differences | Affects frame timing if audio-driven | Decouple audio from game loop; audio is cosmetic only |
| High-DPI display scaling | Canvas resolution varies | Logical resolution fixed at 960x540; physical scaling is cosmetic |

### 8.2 Consent FSM Edge Cases

| Scenario | Expected Behavior | Test |
|----------|-------------------|------|
| Player spams Revoke key | Only first Revoke transitions to `Withdrawn`; subsequent presses are no-ops | Fuzz test: random key sequences |
| Kibo revokes while player is in `Suspended` | State remains `Suspended` (already reduced exposure) | Unit test: dual_control.rs equivalent citeweb_search:3#1 |
| Player and Kibo both try to resume simultaneously | Both signatures required; if only one received within 10s window, remains `Suspended` | Kani-style reasoning: `co_authorisation_requires_two_parties` citeweb_search:3#1 |
| Game paused during consent transition | Transition completes on unpause; wall-clock timeout is frame-count based | Integration test |
| Browser tab closed during `Granted` | On return, state is `Suspended` (session timeout policy) | Session persistence test |

### 8.3 Security Edge Cases

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Malicious save file import | Crafted JSON could overflow buffers | Schema validation + length limits + fuzzing |
| localStorage quota exceeded | Game cannot save progress | Graceful degradation: warn user, offer export |
| Service Worker injection (v9 had no SW; v52 must maintain) | SW could cache malicious content | Explicitly no SW in v52; verify in build script |
| CDN compromise (if assets external) | Malicious WASM replacement | All assets self-hosted; SRI hashes in HTML |
| Browser extension interference | Extensions could inject telemetry | Document: "Disable extensions for guaranteed zero-telemetry" |

---

## 9. CRITICAL ISSUES & EXACT FIXES

### 9.1 Issue #1: License Ambiguity in v9

**Severity:** HIGH  
**Finding:** v9 README states "Apache-2.0 OR MIT unless otherwise stated" but repository contains `COMMERCIAL_LICENSE.md` without clear scope. The `neural-boundary-game` repo is AGPL-3.0-only OR AxonOS Commercial citeweb_search:2#5, but v9 (Boundary Run) does not explicitly state its license in the README header.

**Exact Fix:**
```markdown
## License

Boundary Run v52 is dual-licensed at your option under:

- **AGPL-3.0-only** (for open-source distribution)
- **AxonOS Commercial License** (for closed-source/commercial use)

See `LICENSE-AGPL`, `LICENSE-COMMERCIAL`, and `THIRD_PARTY_NOTICES.md`.

The AxonOS name and logo are trademarks of the AxonOS Project. 
Use of the trademark requires compliance with the Trademark Policy 
in `TRADEMARK.md`.
```

### 9.2 Issue #2: Missing Service Worker Security Posture

**Severity:** MEDIUM  
**Finding:** v9.0.1 explicitly states "No service worker in v9.0.1." This is a security feature (no SW = no cache poisoning), but it is not documented *why* this is important.

**Exact Fix:**
Add to README and Security docs:
```markdown
### Why No Service Worker?

Service Workers can intercept and modify all network requests, 
including those made by the game. In a zero-telemetry, 
zero-backend architecture, a compromised or malicious SW could:
- Inject analytics scripts
- Exfiltrate localStorage data
- Serve modified WASM binaries

Boundary Run v52 explicitly disables SW registration and 
includes a build-time check (`scripts/verify_no_sw.sh`) that 
fails if any SW code is present in the build output.
```

### 9.3 Issue #3: Insufficient Reproducibility Verification

**Severity:** HIGH  
**Finding:** v9 has `scripts/build_web.sh` and `tools/boundary_run_audit.py`, but no explicit reproducibility check (same source → same binary hash across different machines).

**Exact Fix:**
Create `scripts/reproducibility_check.sh`:
```bash
#!/bin/bash
set -euo pipefail

# Build 1
bash scripts/build_web.sh dist_build1
HASH1=$(sha256sum dist_build1/boundary_run_v52.wasm | awk '{print $1}')

# Clean and build 2
rm -rf dist_build1
bash scripts/build_web.sh dist_build2
HASH2=$(sha256sum dist_build2/boundary_run_v52.wasm | awk '{print $1}')

if [ "$HASH1" != "$HASH2" ]; then
    echo "REPRODUCIBILITY FAILURE: $HASH1 != $HASH2"
    exit 1
fi

echo "REPRODUCIBILITY OK: $HASH1"
```

Add to CI:
```yaml
  reproducibility:
    runs-on: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - run: bash scripts/reproducibility_check.sh
```

### 9.4 Issue #4: Missing Fuzz Testing Infrastructure

**Severity:** MEDIUM  
**Finding:** v9 has no fuzz testing. The `axonos-consent` crate has `cargo-fuzz` integration with `wire_decode`, `roundtrip`, and `fsm_sequence` targets citeweb_search:3#1. Boundary Run should have equivalent fuzzing for the WASM simulation layer.

**Exact Fix:**
Create `fuzz/` directory:
```
fuzz/
├── Cargo.toml
├── fuzz_targets/
│   ├── input_sequence.rs      # Random input sequences → no panics
│   ├── save_file_roundtrip.rs # Random save data → valid parse
│   ├── consent_fsm_sequence.rs # Random consent transitions → valid FSM
│   └── seed_determinism.rs    # Same seed → same output
└── corpus/
    └── README.md
```

Add to CI:
```yaml
  fuzz:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo install cargo-fuzz
      - run: cargo fuzz run input_sequence --max-total-time=1800
      - run: cargo fuzz run consent_fsm_sequence --max-total-time=1800
```

### 9.5 Issue #5: No Accessibility Compliance

**Severity:** HIGH  
**Finding:** v9 has no mention of accessibility. Serious educational games must be playable by people with disabilities.

**Exact Fix:**
Implement WCAG 2.1 AA compliance:
1. All colors have ≥4.5:1 contrast ratio (use `scripts/check_contrast.py`)
2. All interactive elements have focus indicators
3. All audio cues have visual equivalents
4. Game speed adjustable (0.5x–2x) in pause menu
5. Full keyboard remapping in settings
6. Screen reader announcements for Kibo warnings using `aria-live="polite"`
7. Colorblind mode with pattern overlays (stripes, dots, checks)

### 9.6 Issue #6: Incomplete Educational Traceability

**Severity:** MEDIUM  
**Finding:** v9 mentions "cognitive privacy, safe intent, consent, deterministic replay proof" but does not explicitly map each concept to AxonOS RFCs or standards.

**Exact Fix:**
Add `docs/TRACEABILITY_MATRIX.md`:
```markdown
# Traceability Matrix: Game Mechanics → AxonOS Architecture

| Game Mechanic | RFC/Standard | Evidence Level | Implementation File |
|---------------|-------------|----------------|-------------------|
| Consent Gates | RFC-0005 (Capability Manifest) | L1 (Kani) | src/consent.rs |
| IntentObservation | RFC-0006 (Wire Format) | L1 (Kani) | src/intent.rs |
| Replay Proof | RFC-0003 (Validation Framework) | L2 (Measurement) | src/replay.rs |
| Guardian Co-Auth | axonos-consent SPEC §12 | L1 (Kani) | src/dual_control.rs |
| WCRT Guarantees | RFC-0001 (EDF Scheduler) | L1 (Kani) | src/scheduler.rs |
| Safe Failure | RFC-0004 (Dual-Core Contract) | L1 (Kani) | src/failure.rs |
```

### 9.7 Issue #7: Donation Address Security

**Severity:** LOW  
**Finding:** v9 lists a Dogecoin address. While donations are optional, cryptocurrency addresses in open-source projects can be targeted for substitution attacks (malicious PRs changing the address).

**Exact Fix:**
1. Move donation address to `DONATIONS.md` (separate from README)
2. Add checksum verification in CI:
```bash
# scripts/verify_donation_address.sh
EXPECTED="DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp"
ACTUAL=$(grep -oP '(?<=Dogecoin: )[A-Za-z0-9]+' DONATIONS.md || true)
if [ "$ACTUAL" != "$EXPECTED" ]; then
    echo "DONATION ADDRESS MISMATCH: $ACTUAL"
    exit 1
fi
```
3. Sign `DONATIONS.md` with maintainer GPG key

### 9.8 Issue #8: Missing Governance Documentation

**Severity:** MEDIUM  
**Finding:** v9 repository has no `GOVERNANCE.md`, `CONTRIBUTING.md`, or `SECURITY.md`. The main AxonOS project has these citeweb_search:2#5, but the game repo should mirror them.

**Exact Fix:**
Create:
- `GOVERNANCE.md`: Fork in 3 clicks, inbound=outbound contribution model, no CLA
- `CONTRIBUTING.md`: Cognitive-data rule (no real neural data in issues), evidence discipline
- `SECURITY.md`: `security@axonos.org`, 90-day coordinated disclosure, first response within 72 hours citeweb_search:2#5
- `CODE_OF_CONDUCT.md`: Adapted from Contributor Covenant

---

## 10. FINAL VERDICT

### 10.1 Readiness Assessment

| Criterion | v9 Status | v52 Target | Gap |
|-----------|-----------|------------|-----|
| **Architecture completeness** | Partial (v9 is browser-only, no WASM) | Full (WASM simulation + JS presentation) | Significant |
| **Determinism** | Seeded RNG, SHA-256 replay | Byte-for-byte reproducibility + Merkle tree | Moderate |
| **Security audit** | Manual review only | Fuzz testing + static analysis + reproducibility | Significant |
| **Accessibility** | None | WCAG 2.1 AA | Significant |
| **Educational depth** | Concepts mentioned, not mapped | Full traceability matrix + Codex + Scenarios | Moderate |
| **CI/CD maturity** | Basic build + smoke test | 8-job CI + reproducibility + fuzz + license audit | Significant |
| **License clarity** | Ambiguous | Explicit AGPL-3.0-only OR Commercial | Moderate |
| **Governance** | Missing | Full docs mirroring AxonOS project | Moderate |
| **Performance** | Unspecified | ≤500KB WASM, ≤2MB assets, 60fps | Moderate |
| **Community** | Single maintainer | Multi-language, contribution-ready | Moderate |

### 10.2 Critical Path to v52 Release

1. **Phase 1 (Weeks 1–2): Foundation**
   - Port core logic to Rust/WASM
   - Implement fixed-point physics
   - Establish ChaCha20 RNG
   - Create reproducibility check script

2. **Phase 2 (Weeks 3–4): Security & Verification**
   - Add fuzz testing infrastructure
   - Implement static analysis pipeline (zero-network verification)
   - Add license compliance check (`cargo deny`)
   - Create SECURITY.md and vulnerability disclosure process

3. **Phase 3 (Weeks 5–6): Accessibility & Polish**
   - Implement WCAG 2.1 AA compliance
   - Add colorblind mode
   - Add screen reader support
   - Add adjustable game speed

4. **Phase 4 (Weeks 7–8): Educational Content**
   - Write Codex entries for all 8 RFCs
   - Implement Scenario Mode (4 clinical ethics cases)
   - Create traceability matrix
   - Record educational voiceover for Kibo (optional)

5. **Phase 5 (Weeks 9–10): Testing & Release**
   - 12-hour fuzz run with zero crashes
   - Reproducibility check on 3 OSes
   - Accessibility audit
   - Community translation sprint
   - v52.0.0 tag + signed release

### 10.3 Go/No-Go Criteria

**GO if ALL of the following are true:**
- [ ] Fuzz suite runs 12h with zero crashes
- [ ] Reproducibility check passes on Linux, macOS, Windows
- [ ] Static analysis confirms zero network calls in WASM
- [ ] WCAG 2.1 AA audit passes
- [ ] All 8 RFCs have corresponding game mechanics + Codex entries
- [ ] License is explicitly AGPL-3.0-only OR Commercial
- [ ] SECURITY.md published with 90-day disclosure policy
- [ ] Performance budget met (≤500KB WASM, ≤2MB assets, 60fps)

**NO-GO if ANY of the following are true:**
- [ ] Telemetry or network calls found in build output
- [ ] Reproducibility check fails on any platform
- [ ] Fuzzing finds crash or undefined behavior
- [ ] License ambiguity remains
- [ ] Accessibility audit fails (blocking issues)
- [ ] Performance budget exceeded by >20%

---

## 11. APPENDICES

### Appendix A: Glossary

- **BCI:** Brain-Computer Interface
- **WCRT:** Worst-Case Response Time
- **Kani:** Rust bounded model checker
- **FSM:** Finite State Machine
- **L1/L2/L3:** Evidence levels (L1=Formal proof, L2=Measurement, L3=Field evidence) citeweb_search:3#5
- **Q0.16:** Fixed-point number format (16 fractional bits)
- **SPSC:** Single-Producer Single-Consumer (queue)
- **EDF:** Earliest Deadline First (scheduling algorithm)
- **StimGuard:** Anti-coercion stimulation enforcement layer

### Appendix B: Reference Repositories

| Repository | Role | License |
|------------|------|---------|
| `axonos-standard` | Canonical technical standard | CC-BY-SA-4.0 |
| `axonos-rfcs` | Engineering RFCs | CC-BY-SA-4.0 |
| `axonos-kernel` | Hard real-time microkernel | Apache-2.0 OR MIT |
| `axonos-sdk` | Application boundary | Apache-2.0 OR MIT |
| `axonos-consent` | Consent FSM + co-authorisation | Apache-2.0 OR MIT |
| `axonos-conformance` | Byte-exact conformance vectors | Apache-2.0 OR MIT |
| `become-the-brain-os` | Community front door game | (varies) |
| `neural-boundary-game` | Interactive demo | AGPL-3.0-only OR Commercial |
| `axonos-boundary-run-v9` | **This game (v9)** | Ambiguous (needs clarification) |

### Appendix C: Version History

| Version | Date | Notes |
|---------|------|-------|
| v9.0.1 | 2026 | Current baseline. Browser-only, seeded RNG, SHA-256 replay proof |
| v52.0.0 | Target 2026-Q4 | Foundation Standard. WASM, full determinism, educational depth, accessibility |

---

**Document End.**

*"Protect the choice. Protect the person."*


## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.
