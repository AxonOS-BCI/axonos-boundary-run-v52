/*
 * AxonOS Boundary Run v52 — The Sovereign Signal
 * Created by Denis Yermakou, Founder & CEO of AxonOS.
 * Copyright © 2026 Denis Yermakou / AxonOS.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AxonOS-Commercial
 *
 * Determinism contract
 * --------------------
 * Gameplay advances on a FIXED 60 Hz timestep, decoupled from the display
 * refresh rate. The simulation uses one seeded RNG (sim.rng) and only exact
 * IEEE-754 arithmetic — no transcendental functions — so the same
 * (seed, inputLog) reproduces the same canonical SHA-256 hash in any language.
 * finalizeProof() re-simulates the recorded input log on export to confirm the
 * hash (`verified`).
 *
 * The render layer is cosmetic. It never reads or writes sim state and never
 * advances sim.rng, so it cannot affect the hash. Cosmetic randomness (particle
 * jitter, the star field) flows through a SEPARATE cosmetic RNG (cos) — there is
 * no Math.random anywhere — and cosmetic motion may use Math.sin/atan2 freely;
 * the simulation never does.
 */
(() => {
  "use strict";

  /* ===================== deterministic core (no DOM, no time) ===================== */
  const W = 960, H = 540;
  const FIELD_TOP = 66, FIELD_BOT = H - 16;
  const AUDIT = { y0: 318, y1: 398 };   // restore band (heal while Granted)
  const FAST  = { y0: 92,  y1: 172 };   // risk band (x2 score, slow drain)
  const PW = 30, PH = 32;               // player hitbox
  const ACC = 1.25, FRICT = 0.80, VMAX = 7.2, STOP = 0.06;
  const DASH_CD = 100, DASH_IFRAMES = 15, DASH_KICK = 7.0, DASH_VMAX = 11.0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function aabb(px, py, h) { return px + PW > h.x && px < h.x + h.w && py + PH > h.y && py < h.y + h.h; }

  function rnd(s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    let t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function makeHazard(s, x) {
    const r = rnd(s);
    let type = "artifact";
    if (r > 0.86) type = "vault";
    else if (r > 0.70) type = "raw";
    else if (r > 0.55) type = "gate";
    const w = 30 + Math.floor(rnd(s) * 22);
    const h = 34 + Math.floor(rnd(s) * 26);
    const y = FIELD_TOP + 8 + Math.floor(rnd(s) * (FIELD_BOT - FIELD_TOP - h - 16));
    const vy = (rnd(s) * 2 - 1) * 0.9;   // deterministic vertical drift (exact float)
    return { x, y, w, h, type, vy, hit: false, passed: false };
  }

  function newSim(seed) {
    const s = {
      seed: seed >>> 0, rng: seed >>> 0, tick: 0,
      x: 150, y: 300, vx: 0, vy: 0,
      integrity: 100, consent: "Granted", suspend: 0,
      score: 0, distance: 0, combo: 0, bestCombo: 0, mult: 1,
      dashCd: 0, iframes: 0, spawnIn: 0, hazards: [], over: false, inputLog: []
    };
    for (let i = 0; i < 6; i++) s.hazards.push(makeHazard(s, W + 140 + i * 175));
    return s;
  }

  // Pure deterministic step. mask bits: 1=left 2=right 4=up 8=down 16=dash.
  // Returns a cosmetic-only event bitfield (not hashed):
  //   1=raw 2=artifact 4=vault 8=gate 16=near-miss 32=dash 64=surge 128=purge
  function stepSim(s, mask) {
    if (s.over) return 0;
    s.tick++;
    s.inputLog.push(mask & 31);
    let ev = 0;

    // --- snappy movement: full acceleration, friction only decays idle axes ---
    let ax = 0, ay = 0;
    if (mask & 1) ax -= 1;
    if (mask & 2) ax += 1;
    if (mask & 4) ay -= 1;
    if (mask & 8) ay += 1;
    s.vx += ax * ACC;
    s.vy += ay * ACC;
    if (ax === 0) { s.vx *= FRICT; if (Math.abs(s.vx) < STOP) s.vx = 0; }
    if (ay === 0) { s.vy *= FRICT; if (Math.abs(s.vy) < STOP) s.vy = 0; }
    s.vx = clamp(s.vx, -VMAX, VMAX);
    s.vy = clamp(s.vy, -VMAX, VMAX);

    // --- dash: burst + brief i-frames on a cooldown ---
    if (s.dashCd > 0) s.dashCd--;
    if (s.iframes > 0) s.iframes--;
    if ((mask & 16) && s.dashCd <= 0) {
      s.iframes = DASH_IFRAMES; s.dashCd = DASH_CD;
      let dx = (mask & 2 ? 1 : 0) - (mask & 1 ? 1 : 0);
      let dy = (mask & 8 ? 1 : 0) - (mask & 4 ? 1 : 0);
      if (dx === 0 && dy === 0) dx = 1;
      s.vx = clamp(s.vx + dx * DASH_KICK, -DASH_VMAX, DASH_VMAX);
      s.vy = clamp(s.vy + dy * DASH_KICK, -DASH_VMAX, DASH_VMAX);
      ev |= 32;
    }

    s.x = clamp(s.x + s.vx, 22, W * 0.6);
    s.y = clamp(s.y + s.vy, FIELD_TOP + 2, FIELD_BOT - PH);
    if (!(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.vx) && Number.isFinite(s.vy))) {
      s.over = true; s.consent = "Withdrawn"; return ev;
    }

    if (s.suspend > 0) { s.suspend--; if (s.suspend === 0 && s.consent === "Suspended") s.consent = "Granted"; }

    const surge = (s.tick % 1500) < 240;
    if (s.tick % 1500 === 1) ev |= 64;
    const speed = (2.6 + Math.min(3.4, s.tick / 2400)) * (surge ? 1.35 : 1);
    s.distance += speed;

    const cy = s.y + PH / 2;
    const inAudit = cy >= AUDIT.y0 && cy <= AUDIT.y1;
    const inFast = cy >= FAST.y0 && cy <= FAST.y1;
    s.mult = inFast ? 2 : 1;
    if (s.consent === "Granted") {
      if (inAudit) s.integrity = Math.min(100, s.integrity + 0.10);
      if (inFast) s.integrity = Math.max(0, s.integrity - 0.04);
      s.score += speed * 0.10 * s.mult * (surge ? 1.5 : 1);
    }

    for (const h of s.hazards) {
      h.x -= speed;
      // deterministic vertical drift with bounce (exact arithmetic only)
      h.y += h.vy;
      if (h.y < FIELD_TOP + 4) { h.y = FIELD_TOP + 4; h.vy = -h.vy; }
      else if (h.y > FIELD_BOT - h.h - 4) { h.y = FIELD_BOT - h.h - 4; h.vy = -h.vy; }

      if (!h.hit && aabb(s.x, s.y, h)) {
        h.hit = true;
        if (h.type === "vault") {
          if (s.consent === "Granted") { s.integrity = Math.min(100, s.integrity + 12); s.combo++; if (s.combo > s.bestCombo) s.bestCombo = s.combo; s.score += 50 + s.combo * 8; ev |= 4; }
        } else if (s.iframes > 0) {
          // dashing THROUGH a threat purges it for score and keeps the combo
          if (h.type === "raw") { s.score += 22 * s.mult; ev |= 128; }
          else if (h.type === "artifact") { s.score += 11 * s.mult; ev |= 128; }
          /* gate: phase through harmlessly */
        } else if (h.type === "raw") { s.integrity -= 18; s.combo = 0; ev |= 1; }
        else if (h.type === "artifact") { s.integrity -= 7; s.combo = 0; ev |= 2; }
        else if (h.type === "gate") { if (s.consent !== "Withdrawn") { s.consent = "Suspended"; s.suspend = 180; ev |= 8; } }
      }
      if (!h.hit && !h.passed && (h.x + h.w) < s.x) {
        h.passed = true;
        if ((h.type === "raw" || h.type === "artifact") && s.consent === "Granted") {
          const gap = Math.min(Math.abs((h.y + h.h) - s.y), Math.abs(h.y - (s.y + PH)));
          if (gap < 16) { s.score += 12 * s.mult; ev |= 16; }
        }
      }
    }
    s.hazards = s.hazards.filter(h => h.x + h.w > -24);

    s.spawnIn -= speed;
    if (s.spawnIn <= 0) {
      s.hazards.push(makeHazard(s, W + 30 + rnd(s) * 70));
      s.spawnIn = (surge ? 78 : 165) + rnd(s) * 120 - Math.min(95, s.tick / 38);
    }

    if (s.integrity <= 0 && !s.over) { s.integrity = 0; s.over = true; s.consent = "Withdrawn"; }
    return ev;
  }

  function canonical(s) {
    return "brv3:" + s.seed + ":" + s.tick + ":" + Math.floor(s.score) + ":" +
      Math.round(s.integrity) + ":" + s.consent + ":" + s.inputLog.join(",");
  }
  function replay(seed, log) { const s = newSim(seed); for (let i = 0; i < log.length; i++) stepSim(s, log[i] & 31); return s; }

  if (typeof document === "undefined") {
    const CORE = { newSim, stepSim, canonical, replay, W, H, FIELD_TOP, FIELD_BOT };
    if (typeof module !== "undefined" && module.exports) module.exports = CORE;
    else if (typeof globalThis !== "undefined") globalThis.BRV52 = CORE;
    return; // headless (node): no DOM wiring
  }

  /* ===================== browser wiring (cinematic render) ===================== */
  const TAU = Math.PI * 2;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const ui = {
    integrity: document.getElementById("integrity"),
    consent: document.getElementById("consent"),
    weather: document.getElementById("weather"),
    proof: document.getElementById("proof"),
    live: document.getElementById("live"),
    codex: document.getElementById("codex")
  };
  const weatherNames = ["Clear", "Overcast", "Storm", "Solar Flare", "Quantum Calm"];
  const STEP = 1000 / 60;
  const HZ = { artifact: "#b98bff", raw: "#ff5d78", gate: "#9aa6b4", vault: "#f0c869" };

  // separate cosmetic RNG — keeps sim.rng untouched, removes Math.random entirely
  const cos = { rng: 0x9e3779b9 };
  function crand() { return rnd(cos); }
  function makeStars(seed) {
    const c = { rng: (seed ^ 0x57A45) >>> 0 };
    const a = [];
    for (let i = 0; i < 84; i++) a.push({ x: rnd(c) * W, y: FIELD_TOP + rnd(c) * (FIELD_BOT - FIELD_TOP), z: 0.3 + rnd(c) * 1.5, s: rnd(c) * 1.7 + 0.4 });
    return a;
  }

  let sim = newSim(dailySeed());
  let keys = new Set();
  let paused = false, colorblind = false, started = false;
  let acc = 0, last = 0, rafT = 0;
  let particles = [], shake = 0, messages = [], codexUnlocked = false, flash = 0, intro = 1;
  let stars = makeStars(sim.seed);

  function dailySeed() {
    const d = new Date();
    return (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) ^ 0xB0A5D52) >>> 0;
  }
  function weatherFor(s) { return weatherNames[(s.seed + Math.floor(s.tick / 720)) % weatherNames.length]; }
  function rr(x, y, w, h, r) { if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); } else { ctx.beginPath(); ctx.rect(x, y, w, h); } }

  function announce(msg) { messages.unshift({ msg, ttl: 210 }); messages = messages.slice(0, 4); if (ui.live) ui.live.textContent = msg; }

  function reset() {
    sim = newSim(dailySeed());
    cos.rng = (sim.seed ^ 0x57A45) >>> 0;
    stars = makeStars(sim.seed);
    particles = []; shake = 0; flash = 0; messages = []; codexUnlocked = false; intro = 0.6;
    paused = false; started = true; acc = 0; last = performance.now();
    if (ui.codex) ui.codex.textContent = "Reach 600 distance to unlock the Consent State Machine entry.";
    announce("Signal online. Dodge red Raw-Signal zones, grab gold Vaults, dash through danger with Shift.");
  }

  function burst(x, y, color, n, spread, glow) {
    spread = spread || 7;
    for (let i = 0; i < n; i++) particles.push({ x, y, color, glow: !!glow, vx: (crand() - 0.5) * spread, vy: (crand() - 0.5) * spread - 2, life: 26 + crand() * 20, size: 2 + crand() * 3 });
    if (particles.length > 340) particles = particles.slice(-340);
  }
  function ring(x, y, color) { particles.push({ ringR: 6, ringMax: 46, color, ring: true, x, y, life: 22, size: 0 }); }

  function react(ev) {
    const px = sim.x + PW / 2, py = sim.y + PH / 2;
    if (ev & 32) { burst(px, py, "#7af0ff", 18, 11, true); ring(px, py, "#7af0ff"); }
    if (ev & 128) { burst(px, py, "#ffd0dc", 16, 9, true); ring(px, py, "#ff8ba0"); announce("Threat purged mid-dash. Combo held."); }
    if (ev & 1) { burst(px, py, "#ff5d78", 22, 9, true); shake = 13; flash = 0.5; announce("Raw Signal Zone: structural-privacy violation. Integrity -18, combo lost."); }
    if (ev & 2) { burst(px, py, "#b98bff", 11, 7, true); shake = 6; announce("Artifact spike: intent fidelity degraded. Integrity -7."); }
    if (ev & 4) { burst(px, py, "#f0c869", 18, 7, true); announce("Sealed Vault +12 integrity. Combo " + sim.combo + " (x" + (1 + Math.floor(sim.combo / 5)) + " streak)."); }
    if (ev & 8) { burst(px, py, "#aab4c0", 11, 6, false); announce("Stale consent gate: suspended ~3s, scoring paused, auto-resume."); }
    if (ev & 16) burst(px, py, "#9bffb0", 7, 5, true);
    if (ev & 64) { announce("Surge wave: denser, faster, drifting hazards — but +50% score. Hold the line."); shake = Math.max(shake, 7); }
  }

  function inputMask() {
    let m = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) m |= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) m |= 2;
    if (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space")) m |= 4;
    if (keys.has("ArrowDown") || keys.has("KeyS")) m |= 8;
    if (keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("KeyK")) m |= 16;
    return m;
  }

  function tickLogic() {
    touchSteer();
    if (paused || sim.over || !started) return;
    const before = sim.over;
    const ev = stepSim(sim, inputMask());
    if (ev) react(ev);
    if (!codexUnlocked && sim.distance > 600) {
      codexUnlocked = true;
      if (ui.codex) ui.codex.textContent = "Consent FSM: Granted permits bounded operation; Suspended reduces exposure and pauses scoring; Withdrawn is terminal and seals the run.";
      announce("Codex unlocked: Consent State Machine.");
    }
    if (sim.over && !before) { announce("Run sealed. Integrity exhausted. Export your replay proof."); finalizeProof(true); }
  }

  /* ---------- proof ---------- */
  async function sha256hex(text) {
    if (!globalThis.crypto || !crypto.subtle || typeof crypto.subtle.digest !== "function") {
      throw new Error("WebCrypto SHA-256 unavailable. Use HTTPS or a modern browser.");
    }
    const data = new TextEncoder().encode(String(text));
    const h = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function finalizeProof(silent) {
    try {
      const liveHash = await sha256hex(canonical(sim));
      const rep = replay(sim.seed, sim.inputLog.slice());
      const verified = (await sha256hex(canonical(rep))) === liveHash;
      const proof = {
        schema: "boundary-run-replay-v3", creator: "Denis Yermakou, Founder & CEO of AxonOS",
        seed: sim.seed, ticks: sim.tick, score: Math.floor(sim.score), integrity: Math.round(sim.integrity),
        consent: sim.consent, bestCombo: sim.bestCombo, hash: liveHash, verified, inputLog: sim.inputLog
      };
      if (ui.proof) ui.proof.textContent = (verified ? "\u2713 " : "? ") + liveHash.slice(0, 12);
      if (!silent) {
        const safeHash = String(liveHash).replace(/[^a-f0-9]/gi, "").slice(0, 12) || "unavailable";
        const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "boundary-run-v52-proof-" + safeHash + ".json";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        announce("Proof exported (verified=" + verified + "): boundary-run-v52-proof-" + safeHash + ".json");
      }
      return proof;
    } catch (e) {
      if (ui.proof) ui.proof.textContent = "unavailable";
      announce("Proof unavailable: " + e.message);
      return { schema: "boundary-run-replay-v3", seed: sim.seed, ticks: sim.tick, proof: "unavailable", error: e.message };
    }
  }

  /* ---------- render ---------- */
  function draw() {
    const t = rafT;
    if (intro > 0) intro = Math.max(0, intro - 0.02);
    const sx = shake > 0 ? (crand() - 0.5) * shake : 0;
    const sy = shake > 0 ? (crand() - 0.5) * shake : 0;
    if (shake > 0) shake *= 0.85;
    ctx.save();
    ctx.translate(sx, sy);

    // depth gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0b1a30"); g.addColorStop(0.55, "#07101e"); g.addColorStop(1, "#020308");
    ctx.fillStyle = g; ctx.fillRect(-26, -26, W + 52, H + 52);

    // parallax starfield + scrolling depth grid
    ctx.globalCompositeOperation = "lighter";
    for (const st of stars) {
      const x = ((st.x - sim.distance * st.z * 0.25) % W + W) % W;
      ctx.globalAlpha = 0.08 + 0.10 * st.z;
      ctx.fillStyle = "#8fb6ff"; ctx.fillRect(x, st.y, st.s, st.s);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.13;
    const off = (sim.distance % 40);
    ctx.strokeStyle = "#5e92ff"; ctx.lineWidth = 1;
    for (let x = -off; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, FIELD_TOP); ctx.lineTo(x - 18, FIELD_BOT); ctx.stroke(); }
    ctx.globalAlpha = 1;

    drawBand(FAST, "rgba(240,200,105,", "FAST \u00b7 x2 score \u00b7 drains", t, colorblind ? 16 : 0);
    drawBand(AUDIT, "rgba(56,214,160,", "AUDIT \u00b7 restores integrity", t, colorblind ? 24 : 0);

    for (const h of sim.hazards) drawHazard(h, t);

    drawPlayer(t);

    // particles (additive glow + expanding rings)
    ctx.globalCompositeOperation = "lighter";
    for (const p of particles) {
      if (p.ring) { ctx.globalAlpha = Math.max(0, p.life / 22) * 0.7; ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.ringR, 0, TAU); ctx.stroke(); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30)); ctx.fillStyle = p.color;
      if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; }
      ctx.fillRect(p.x, p.y, p.size, p.size); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";

    // vignette + hit flash + intro fade
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (flash > 0) { ctx.fillStyle = "rgba(255,80,110," + flash + ")"; ctx.fillRect(0, 0, W, H); flash *= 0.82; }
    if (intro > 0) { ctx.fillStyle = "rgba(2,5,12," + intro + ")"; ctx.fillRect(0, 0, W, H); }

    drawHud(t);

    let my = 86; ctx.font = "600 15px ui-sans-serif"; ctx.textAlign = "left";
    for (const m of messages) { ctx.globalAlpha = Math.min(1, m.ttl / 44); ctx.fillStyle = "#dfeaf6"; ctx.fillText("Kibo \u203a " + m.msg, 22, my); my += 22; }
    ctx.globalAlpha = 1;

    if (!started) overlay("BOUNDARY RUN", "Start \u00b7 Arrows / WASD move \u00b7 Shift dashes \u00b7 dodge red, grab gold");
    else if (paused) overlay("PAUSED", "Press P or Pause to resume");
    else if (sim.over) overlay("RUN SEALED \u2014 PROOF GENERATED", "Score " + Math.floor(sim.score) + " \u00b7 best combo " + sim.bestCombo + " \u00b7 Start to run again");

    ctx.restore();

    if (ui.integrity) ui.integrity.textContent = Math.max(0, Math.round(sim.integrity)) + "%";
    if (ui.consent) ui.consent.textContent = sim.consent;
    if (ui.weather) ui.weather.textContent = weatherFor(sim);
  }

  // detailed, directional "Sovereign Signal" avatar
  function drawPlayer(t) {
    const cx = sim.x + PW / 2, cy = sim.y + PH / 2;
    const spd = Math.sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
    const tilt = clamp(sim.vy * 0.05, -0.5, 0.5) + clamp(sim.vx * 0.012, -0.18, 0.18);
    const dashing = sim.iframes > 0;
    const suspended = sim.consent === "Suspended";
    const low = sim.integrity <= 25;
    const hw = PW / 2, hh = PH / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);

    // thruster plume (rear)
    ctx.globalCompositeOperation = "lighter";
    const flame = 8 + spd * 2.4 + (dashing ? 16 : 0);
    const fg = ctx.createLinearGradient(-hw - flame, 0, -hw + 2, 0);
    fg.addColorStop(0, "rgba(122,240,255,0)"); fg.addColorStop(0.6, dashing ? "rgba(150,245,255,.7)" : "rgba(95,208,255,.55)"); fg.addColorStop(1, dashing ? "#dffaff" : "#9fe0ff");
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(-hw + 2, -7); ctx.lineTo(-hw - flame, 0); ctx.lineTo(-hw + 2, 7); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // hull path (hexagonal craft, nose forward)
    function hullPath() {
      ctx.beginPath();
      ctx.moveTo(hw + 3, 0);
      ctx.lineTo(hw * 0.42, -hh);
      ctx.lineTo(-hw * 0.66, -hh * 0.82);
      ctx.lineTo(-hw, -hh * 0.28);
      ctx.lineTo(-hw, hh * 0.28);
      ctx.lineTo(-hw * 0.66, hh * 0.82);
      ctx.lineTo(hw * 0.42, hh);
      ctx.closePath();
    }
    const hull = ctx.createLinearGradient(0, -hh, 0, hh);
    if (suspended) { hull.addColorStop(0, "#ffe6b0"); hull.addColorStop(1, "#d79a3e"); }
    else if (dashing) { hull.addColorStop(0, "#eafdff"); hull.addColorStop(1, "#79e6ff"); }
    else { hull.addColorStop(0, "#eaf6ff"); hull.addColorStop(0.55, "#bfe2ff"); hull.addColorStop(1, "#6fa8e8"); }
    ctx.save();
    ctx.shadowColor = dashing ? "#7af0ff" : suspended ? "#f4c76b" : "#8fd6ff";
    ctx.shadowBlur = dashing ? 28 : 16;
    hullPath(); ctx.fillStyle = hull; ctx.fill();
    ctx.restore();
    // low-integrity warning rim
    hullPath();
    ctx.strokeStyle = low ? ("rgba(255,90,110," + (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t / 90))) + ")") : "rgba(255,255,255,.92)";
    ctx.lineWidth = low ? 2.4 : 1.6; ctx.stroke();

    // panel line
    ctx.strokeStyle = "rgba(20,60,110,.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-hw * 0.5, -hh * 0.45); ctx.lineTo(hw * 0.5, 0); ctx.lineTo(-hw * 0.5, hh * 0.45); ctx.stroke();

    // neural core (pulsing)
    const pulse = 0.6 + 0.4 * Math.sin(t / 170);
    ctx.save();
    ctx.shadowColor = suspended ? "#ffd27a" : "#aef0ff"; ctx.shadowBlur = 12;
    const core = ctx.createRadialGradient(-1, 0, 0, -1, 0, 6 + pulse * 2);
    core.addColorStop(0, "#ffffff"); core.addColorStop(0.6, suspended ? "#ffcf7a" : "#bfecff"); core.addColorStop(1, "rgba(120,220,255,0)");
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(-1, 0, 6 + pulse * 2, 0, TAU); ctx.fill();
    ctx.restore();
    // sensor tip
    ctx.fillStyle = "#d6f4ff"; ctx.beginPath(); ctx.arc(hw * 0.78, 0, 1.8, 0, TAU); ctx.fill();

    // dash shield ring
    if (dashing) {
      const a = sim.iframes / DASH_IFRAMES;
      ctx.strokeStyle = "rgba(122,240,255," + (0.3 + 0.5 * a) + ")"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, hw * 1.5, t / 50, t / 50 + Math.PI * 1.5); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBand(band, rgba, label, t, stripe) {
    const hgt = band.y1 - band.y0;
    const pulse = 0.10 + 0.05 * (0.5 + 0.5 * Math.sin(t / 600));
    const lg = ctx.createLinearGradient(0, band.y0, 0, band.y1);
    lg.addColorStop(0, rgba + (pulse + 0.04) + ")"); lg.addColorStop(0.5, rgba + pulse + ")"); lg.addColorStop(1, rgba + (pulse + 0.04) + ")");
    ctx.fillStyle = lg; ctx.fillRect(0, band.y0, W, hgt);
    ctx.strokeStyle = rgba + "0.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, band.y0); ctx.lineTo(W, band.y0); ctx.moveTo(0, band.y1); ctx.lineTo(W, band.y1); ctx.stroke();
    if (stripe) { ctx.globalAlpha = 0.18; ctx.fillStyle = rgba + "0.6)"; for (let x = 0; x < W; x += stripe) ctx.fillRect(x, band.y0, 3, hgt); ctx.globalAlpha = 1; }
    ctx.fillStyle = rgba + "0.7)"; ctx.font = "600 11px ui-sans-serif"; ctx.textAlign = "right";
    ctx.fillText(label, W - 12, band.y0 + 15); ctx.textAlign = "left";
  }

  function drawHazard(h, t) {
    const c = HZ[h.type] || "#fff";
    ctx.save();
    ctx.shadowColor = c; ctx.shadowBlur = h.type === "vault" ? 16 : 10;
    ctx.fillStyle = c; ctx.globalAlpha = 0.95;
    if (h.type === "gate") { rr(h.x, h.y, h.w, h.h, 4); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1; rr(h.x + 4, h.y + 4, h.w - 8, h.h - 8, 3); ctx.stroke(); }
    else if (h.type === "vault") { rr(h.x, h.y, h.w, h.h, 5); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "rgba(0,0,0,.42)"; ctx.fillRect(h.x + h.w / 2 - 2, h.y + h.h / 2 - 5, 4, 10); ctx.beginPath(); ctx.arc(h.x + h.w / 2, h.y + h.h / 2 - 6, 4, Math.PI, 0); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,.42)"; ctx.stroke(); }
    else if (h.type === "raw") { ctx.beginPath(); ctx.moveTo(h.x, h.y + h.h); ctx.lineTo(h.x + h.w / 2, h.y); ctx.lineTo(h.x + h.w, h.y + h.h); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(h.x + h.w / 2, h.y + h.h / 2, Math.min(h.w, h.h) / 2, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (colorblind) { ctx.fillStyle = "#fff"; ctx.font = "700 9px ui-sans-serif"; ctx.textAlign = "center"; ctx.fillText(h.type[0].toUpperCase(), h.x + h.w / 2, h.y - 4); ctx.textAlign = "left"; }
  }

  function drawHud(t) {
    ctx.save();
    ctx.fillStyle = "rgba(4,9,18,.62)"; ctx.fillRect(0, 0, W, 50);
    ctx.fillStyle = "rgba(122,240,255,.25)"; ctx.fillRect(0, 50, W, 1);
    ctx.textAlign = "left";
    ctx.fillStyle = "#36d6a0"; ctx.font = "800 13px ui-sans-serif"; ctx.fillText("AXON", 20, 31);
    ctx.fillStyle = "#f0c869"; ctx.fillText("OS", 60, 31);
    ctx.fillStyle = "#f4f7fb"; ctx.font = "700 18px ui-sans-serif"; ctx.fillText(String(Math.floor(sim.score)).padStart(5, "0"), 96, 32);
    ctx.font = "700 13px ui-sans-serif";
    ctx.fillStyle = sim.consent === "Granted" ? "#79f0c0" : sim.consent === "Suspended" ? "#f4c76b" : "#ff6b6b";
    ctx.fillText("\u25cf " + sim.consent, 188, 31);
    if (sim.combo > 0) { ctx.fillStyle = "#ffd479"; ctx.fillText("\u2726 " + sim.combo, 320, 31); }
    if (sim.mult > 1) { ctx.fillStyle = "#ffd479"; ctx.fillText("x2", 380, 31); }
    ctx.fillStyle = sim.dashCd <= 0 ? "#7af0ff" : "rgba(122,240,255,.32)";
    ctx.fillText(sim.dashCd <= 0 ? "DASH \u25c8" : "dash \u25c7", 420, 31);
    const bx = W - 232, bw = 212;
    ctx.fillStyle = "rgba(255,255,255,.14)"; rr(bx, 17, bw, 16, 8); ctx.fill();
    const ig = Math.max(0, Math.min(1, sim.integrity / 100));
    const ic = ig > 0.5 ? "#79f0c0" : ig > 0.25 ? "#f4c76b" : "#ff6b6b";
    ctx.save(); ctx.shadowColor = ic; ctx.shadowBlur = 8; ctx.fillStyle = ic; rr(bx, 17, Math.max(2, bw * ig), 16, 8); ctx.fill(); ctx.restore();
    ctx.fillStyle = "#cfe0f2"; ctx.font = "700 10px ui-sans-serif"; ctx.textAlign = "right"; ctx.fillText("INTEGRITY", W - 20, 13); ctx.textAlign = "left";
    ctx.restore();
  }

  function overlay(title, sub) {
    ctx.save();
    ctx.fillStyle = "rgba(3,7,14,.6)"; ctx.fillRect(0, 0, W, H);
    const pw = 560, ph = 150, x = (W - pw) / 2, y = (H - ph) / 2;
    ctx.shadowColor = "rgba(54,214,160,.4)"; ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(10,20,34,.92)"; rr(x, y, pw, ph, 18); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(122,167,255,.3)"; ctx.lineWidth = 1; rr(x, y, pw, ph, 18); ctx.stroke();
    const tg = ctx.createLinearGradient(0, y + 40, 0, y + 78);
    tg.addColorStop(0, "#ffffff"); tg.addColorStop(1, "#9cc8ff");
    ctx.fillStyle = tg; ctx.font = "800 32px ui-sans-serif"; ctx.textAlign = "center";
    ctx.fillText(title, W / 2, y + 70);
    ctx.fillStyle = "#bcd2e8"; ctx.font = "600 14px ui-sans-serif"; ctx.fillText(sub, W / 2, y + 104);
    ctx.textAlign = "left"; ctx.restore();
  }

  /* ---------- fixed-timestep loop ---------- */
  function frame(now) {
    if (!last) last = now;
    rafT = now;
    let dt = now - last; last = now;
    if (dt > 250) dt = 250;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 6) { tickLogic(); acc -= STEP; steps++; }
    for (const p of particles) { if (p.ring) { p.ringR += (p.ringMax - p.ringR) * 0.2; p.life--; continue; } p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.life--; }
    particles = particles.filter(p => p.life > 0);
    for (const m of messages) m.ttl--;
    messages = messages.filter(m => m.ttl > 0);
    draw();
    requestAnimationFrame(frame);
  }

  /* ---------- input ---------- */
  window.addEventListener("keydown", e => {
    keys.add(e.code);
    if (e.code === "KeyP") paused = !paused;
    if (e.code === "Enter" && (!started || sim.over)) reset();
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", e => keys.delete(e.code));

  const byId = id => document.getElementById(id);
  if (byId("start")) byId("start").addEventListener("click", reset);
  if (byId("pause")) byId("pause").addEventListener("click", () => { paused = !paused; });
  if (byId("colorblind")) byId("colorblind").addEventListener("click", () => { colorblind = !colorblind; document.body.classList.toggle("colorblind", colorblind); });
  if (byId("export")) byId("export").addEventListener("click", () => finalizeProof(false));

  /* copy the donation wallet to the clipboard */
  function flashCopied(el, ok) {
    const note = byId("copy-note");
    if (note) { note.textContent = ok ? "Copied to clipboard" : "Copy failed \u2014 select and copy manually"; note.classList.add("show"); setTimeout(() => note.classList.remove("show"), 1800); }
    if (el) { el.classList.add("copied"); setTimeout(() => el.classList.remove("copied"), 1200); }
  }
  function copyWallet(el) {
    const addr = (byId("doge-addr") && byId("doge-addr").textContent.trim()) || "DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(() => flashCopied(el, true), () => flashCopied(el, false));
      } else {
        const ta = document.createElement("textarea");
        ta.value = addr; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        flashCopied(el, ok);
      }
    } catch (e) { flashCopied(el, false); }
  }
  if (byId("copy-doge")) {
    byId("copy-doge").addEventListener("click", () => copyWallet(byId("copy-doge")));
    byId("copy-doge").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copyWallet(byId("copy-doge")); } });
  }

  /* touch: drag to steer, two-finger tap to dash */
  const stage = document.querySelector(".stage-wrap") || canvas;
  let touching = false, tx = 0, ty = 0, dashTouch = false;
  function touchPos(e) {
    const r = canvas.getBoundingClientRect();
    const tt = e.touches[0];
    tx = (tt.clientX - r.left) * (W / r.width);
    ty = (tt.clientY - r.top) * (H / r.height);
    dashTouch = e.touches.length >= 2;
  }
  function touchSteer() {
    keys.delete("ArrowLeft"); keys.delete("ArrowRight"); keys.delete("ArrowUp"); keys.delete("ArrowDown"); keys.delete("KeyK");
    if (!touching) return;
    const cx = sim.x + PW / 2, cy = sim.y + PH / 2;
    if (tx < cx - 10) keys.add("ArrowLeft"); else if (tx > cx + 10) keys.add("ArrowRight");
    if (ty < cy - 10) keys.add("ArrowUp"); else if (ty > cy + 10) keys.add("ArrowDown");
    if (dashTouch) keys.add("KeyK");
  }
  stage.addEventListener("touchstart", e => { e.preventDefault(); touching = true; if (!started || sim.over) reset(); touchPos(e); }, { passive: false });
  stage.addEventListener("touchmove", e => { e.preventDefault(); touchPos(e); }, { passive: false });
  stage.addEventListener("touchend", e => { e.preventDefault(); if (e.touches.length === 0) { touching = false; dashTouch = false; } }, { passive: false });
  stage.addEventListener("touchcancel", () => { touching = false; dashTouch = false; });

  requestAnimationFrame(frame);
})();
