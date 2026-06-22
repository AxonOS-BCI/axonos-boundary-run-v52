/*
 * AxonOS Boundary Run v52 — The Sovereign Signal
 * Created by Denis Yermakou, Founder & CEO of AxonOS.
 * Copyright © 2026 Denis Yermakou / AxonOS.
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AxonOS-Commercial
 *
 * Determinism contract
 * --------------------
 * Gameplay advances on a FIXED 60 Hz timestep, decoupled from the display
 * refresh rate. All gameplay randomness flows through one seeded RNG whose state
 * lives in the sim. The same (seed, inputLog) reproduces the same final state
 * and the same canonical SHA-256 hash, in any language. finalizeProof() records
 * the input log and re-simulates it on export to confirm the hash (`verified`).
 * Cosmetic effects (particles, shake, flashes) never touch sim state.
 */
(() => {
  "use strict";

  /* ===================== deterministic core (no DOM, no time) ===================== */
  const W = 960, H = 540;
  const FIELD_TOP = 66, FIELD_BOT = H - 16;
  const AUDIT = { y0: 318, y1: 398 };   // restore band (heal while Granted)
  const FAST  = { y0: 92,  y1: 172 };   // risk band (x2 score, slow drain)
  const PW = 30, PH = 32;               // player hitbox
  const ACC = 0.85, FRICT = 0.85, VMAX = 6.0;
  const DASH_CD = 110, DASH_IFRAMES = 14, DASH_KICK = 6.0, DASH_VMAX = 10.0;

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
    return { x, y, w, h, type, hit: false, passed: false };
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
  //   1=raw 2=artifact 4=vault 8=gate 16=near-miss 32=dash 64=surge-start
  function stepSim(s, mask) {
    if (s.over) return 0;
    s.tick++;
    s.inputLog.push(mask & 31);
    let ev = 0;

    let ax = 0, ay = 0;
    if (mask & 1) ax -= ACC;
    if (mask & 2) ax += ACC;
    if (mask & 4) ay -= ACC;
    if (mask & 8) ay += ACC;
    s.vx = clamp((s.vx + ax) * FRICT, -VMAX, VMAX);
    s.vy = clamp((s.vy + ay) * FRICT, -VMAX, VMAX);

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
      s.score += speed * 0.10 * s.mult;
    }

    for (const h of s.hazards) {
      h.x -= speed;
      if (!h.hit && aabb(s.x, s.y, h)) {
        h.hit = true;
        if (h.type === "vault") {
          if (s.consent === "Granted") { s.integrity = Math.min(100, s.integrity + 12); s.combo++; if (s.combo > s.bestCombo) s.bestCombo = s.combo; s.score += 50 + s.combo * 8; ev |= 4; }
        } else if (s.iframes > 0) {
          /* dashing through a hazard: phased, no damage */
        } else if (h.type === "raw") { s.integrity -= 18; s.combo = 0; ev |= 1; }
        else if (h.type === "artifact") { s.integrity -= 7; s.combo = 0; ev |= 2; }
        else if (h.type === "gate") { if (s.consent !== "Withdrawn") { s.consent = "Suspended"; s.suspend = 180; ev |= 8; } }
      }
      // near-miss: a dangerous hazard slips just past without a hit
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

  /* ===================== browser wiring ===================== */
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

  let sim = newSim(dailySeed());
  let keys = new Set();
  let paused = false, colorblind = false, started = false;
  let acc = 0, last = 0;
  let particles = [], shake = 0, messages = [], codexUnlocked = false;

  function dailySeed() {
    const d = new Date();
    return (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) ^ 0xB0A5D52) >>> 0;
  }
  function weatherFor(s) { return weatherNames[(s.seed + Math.floor(s.tick / 720)) % weatherNames.length]; }

  function announce(msg) {
    messages.unshift({ msg, ttl: 200 });
    messages = messages.slice(0, 4);
    if (ui.live) ui.live.textContent = msg;
  }

  function reset() {
    sim = newSim(dailySeed());
    particles = []; shake = 0; messages = []; codexUnlocked = false;
    paused = false; started = true; acc = 0; last = performance.now();
    if (ui.codex) ui.codex.textContent = "Reach 600 distance to unlock the Consent State Machine entry.";
    announce("Run started. Dodge red Raw-Signal zones, grab gold Vaults, dash through danger with Shift.");
  }

  function burst(x, y, color, n, spread) {
    spread = spread || 7;
    for (let i = 0; i < n; i++) {
      particles.push({ x, y, color, vx: (Math.random() - 0.5) * spread, vy: (Math.random() - 0.5) * spread - 2, life: 26 + Math.random() * 18, size: 2 + Math.random() * 3 });
    }
    if (particles.length > 280) particles = particles.slice(-280);
  }

  function react(ev) {
    const px = sim.x + PW / 2, py = sim.y + PH / 2;
    if (ev & 32) { burst(px, py, "#7af0ff", 16, 10); }
    if (ev & 1) { burst(px, py, "#ff5d78", 20, 9); shake = 12; announce("Raw Signal Zone: structural-privacy violation. Integrity -18, combo lost."); }
    if (ev & 2) { burst(px, py, "#a879ff", 10); shake = 5; announce("Artifact spike: intent fidelity degraded. Integrity -7."); }
    if (ev & 4) { burst(px, py, "#e7c266", 16); announce("Sealed Vault +12 integrity. Combo " + sim.combo + " (x" + (1 + Math.floor(sim.combo / 5)) + " streak)."); }
    if (ev & 8) { burst(px, py, "#aab4c0", 10); announce("Stale consent gate: suspended ~3s, scoring paused, auto-resume."); }
    if (ev & 16) { burst(px, py, "#9effa0", 6, 4); }
    if (ev & 64) { announce("Surge wave incoming — denser, faster hazards. Hold the line."); shake = Math.max(shake, 6); }
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
        schema: "boundary-run-replay-v3",
        creator: "Denis Yermakou, Founder & CEO of AxonOS",
        seed: sim.seed, ticks: sim.tick,
        score: Math.floor(sim.score), integrity: Math.round(sim.integrity),
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

  /* ---------- render (cosmetic) ---------- */
  function draw() {
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    if (shake > 0) shake *= 0.86;
    ctx.save();
    ctx.translate(sx, sy);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a1626"); g.addColorStop(1, "#020408");
    ctx.fillStyle = g; ctx.fillRect(-24, -24, W + 48, H + 48);

    ctx.globalAlpha = 0.16;
    const off = (sim.distance % 36);
    for (let x = -off; x < W; x += 36) { ctx.fillStyle = "#6fa8ff"; ctx.fillRect(x, FIELD_TOP, 1, FIELD_BOT - FIELD_TOP); }
    ctx.globalAlpha = 1;

    drawBand(FAST, "rgba(232,170,60,.13)", "rgba(232,170,60,.55)", "FAST \u00b7 x2 score \u00b7 drains", colorblind ? 16 : 0);
    drawBand(AUDIT, "rgba(56,214,160,.13)", "rgba(56,214,160,.55)", "AUDIT \u00b7 restores integrity", colorblind ? 24 : 0);

    for (const h of sim.hazards) drawHazard(h);

    // player
    const px = sim.x, py = sim.y;
    const dashing = sim.iframes > 0;
    if (dashing) { ctx.globalAlpha = 0.35; ctx.fillStyle = "#7af0ff"; ctx.fillRect(px - 8, py - 4, PW + 16, PH + 8); ctx.globalAlpha = 1; }
    ctx.fillStyle = dashing ? "#bff4ff" : sim.consent === "Suspended" ? "#f4c76b" : "#e7f4ff";
    ctx.fillRect(px, py, PW, PH);
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2; ctx.strokeRect(px, py, PW, PH);
    ctx.fillStyle = "#a7e6ff";
    ctx.beginPath(); ctx.arc(px + PW / 2, py - 12 + Math.sin(sim.tick / 12) * 3, 6, 0, Math.PI * 2); ctx.fill();

    for (const p of particles) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 28)); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.globalAlpha = 1;

    // HUD bar
    ctx.fillStyle = "rgba(2,6,12,.55)"; ctx.fillRect(0, 0, W, 52);
    ctx.fillStyle = "#f4f7fb"; ctx.font = "700 18px ui-sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Score " + Math.floor(sim.score), 20, 33);
    ctx.fillStyle = sim.consent === "Granted" ? "#79f0c0" : sim.consent === "Suspended" ? "#f4c76b" : "#ff6b6b";
    ctx.fillText("Consent " + sim.consent, 168, 33);
    if (sim.combo > 0) { ctx.fillStyle = "#ffd479"; ctx.fillText("Combo " + sim.combo, 356, 33); }
    if (sim.mult > 1) { ctx.fillStyle = "#ffd479"; ctx.fillText("x2", 470, 33); }
    // dash pip
    ctx.fillStyle = sim.dashCd <= 0 ? "#7af0ff" : "rgba(122,240,255,.3)";
    ctx.fillText(sim.dashCd <= 0 ? "DASH \u25cf" : "dash \u25cb", 510, 33);
    // integrity bar
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(W - 230, 18, 210, 16);
    const ig = Math.max(0, Math.min(1, sim.integrity / 100));
    ctx.fillStyle = ig > 0.5 ? "#79f0c0" : ig > 0.25 ? "#f4c76b" : "#ff6b6b";
    ctx.fillRect(W - 230, 18, 210 * ig, 16);
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1; ctx.strokeRect(W - 230, 18, 210, 16);

    let my = 80; ctx.font = "600 15px ui-sans-serif";
    for (const m of messages) { ctx.fillStyle = "rgba(238,243,248," + Math.min(1, m.ttl / 40) + ")"; ctx.fillText("Kibo: " + m.msg, 20, my); my += 22; }

    if (!started) banner("BOUNDARY RUN", "Press Start. Arrows / WASD move \u00b7 Shift dashes \u00b7 dodge red, grab gold.");
    else if (paused) banner("PAUSED", "Press P or Pause to resume.");
    else if (sim.over) banner("RUN SEALED \u2014 PROOF GENERATED", "Score " + Math.floor(sim.score) + " \u00b7 best combo " + sim.bestCombo + " \u00b7 Start to run again.");

    ctx.restore();

    if (ui.integrity) ui.integrity.textContent = Math.max(0, Math.round(sim.integrity)) + "%";
    if (ui.consent) ui.consent.textContent = sim.consent;
    if (ui.weather) ui.weather.textContent = weatherFor(sim);
  }

  function drawBand(band, fill, stroke, label, stripe) {
    ctx.fillStyle = fill; ctx.fillRect(0, band.y0, W, band.y1 - band.y0);
    ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(0, band.y0, W, band.y1 - band.y0);
    if (stripe) { ctx.globalAlpha = 0.22; for (let x = 0; x < W; x += stripe) ctx.fillRect(x, band.y0, 3, band.y1 - band.y0); ctx.globalAlpha = 1; }
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "600 12px ui-sans-serif"; ctx.textAlign = "right";
    ctx.fillText(label, W - 10, band.y0 + 16); ctx.textAlign = "left";
  }

  function drawHazard(h) {
    const colors = { artifact: "#a879ff", raw: "#ff4c6d", gate: "#95a0ac", vault: "#e7c266" };
    ctx.fillStyle = colors[h.type] || "#fff";
    ctx.globalAlpha = 0.92;
    if (h.type === "gate") { ctx.fillRect(h.x, h.y, h.w, h.h); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.strokeRect(h.x + 4, h.y + 4, h.w - 8, h.h - 8); }
    else if (h.type === "vault") { ctx.fillRect(h.x, h.y, h.w, h.h); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(h.x + h.w / 2 - 2, h.y + h.h / 2 - 5, 4, 10); }
    else if (h.type === "raw") { ctx.beginPath(); ctx.moveTo(h.x, h.y + h.h); ctx.lineTo(h.x + h.w / 2, h.y); ctx.lineTo(h.x + h.w, h.y + h.h); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(h.x + h.w / 2, h.y + h.h / 2, Math.min(h.w, h.h) / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (colorblind) { ctx.fillStyle = "#fff"; ctx.font = "700 9px ui-sans-serif"; ctx.textAlign = "center"; ctx.fillText(h.type[0].toUpperCase(), h.x + h.w / 2, h.y - 3); ctx.textAlign = "left"; }
  }

  function banner(title, sub) {
    ctx.fillStyle = "rgba(2,6,12,.72)"; ctx.fillRect(0, H / 2 - 58, W, 116);
    ctx.fillStyle = "#fff"; ctx.font = "800 34px ui-sans-serif"; ctx.textAlign = "center";
    ctx.fillText(title, W / 2, H / 2 - 2);
    ctx.fillStyle = "#bcd2e8"; ctx.font = "600 15px ui-sans-serif";
    ctx.fillText(sub, W / 2, H / 2 + 28); ctx.textAlign = "left";
  }

  /* ---------- fixed-timestep loop ---------- */
  function frame(now) {
    if (!last) last = now;
    let dt = now - last; last = now;
    if (dt > 250) dt = 250;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 6) { tickLogic(); acc -= STEP; steps++; }
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--; }
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
    if (el) { const t = el.getAttribute("data-label") || el.textContent; el.classList.add("copied"); setTimeout(() => el.classList.remove("copied"), 1200); }
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

  /* touch: drag anywhere on the stage to steer; two-finger tap dashes */
  const stage = document.querySelector(".stage-wrap") || canvas;
  let touching = false, tx = 0, ty = 0, dashTouch = false;
  function touchPos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    tx = (t.clientX - r.left) * (W / r.width);
    ty = (t.clientY - r.top) * (H / r.height);
    dashTouch = e.touches.length >= 2;
  }
  function touchSteer() {
    keys.delete("ArrowLeft"); keys.delete("ArrowRight"); keys.delete("ArrowUp"); keys.delete("ArrowDown"); keys.delete("KeyK");
    if (!touching) return;
    const cx = sim.x + PW / 2, cy = sim.y + PH / 2;
    if (tx < cx - 12) keys.add("ArrowLeft"); else if (tx > cx + 12) keys.add("ArrowRight");
    if (ty < cy - 12) keys.add("ArrowUp"); else if (ty > cy + 12) keys.add("ArrowDown");
    if (dashTouch) keys.add("KeyK");
  }
  stage.addEventListener("touchstart", e => { e.preventDefault(); touching = true; if (!started || sim.over) reset(); touchPos(e); }, { passive: false });
  stage.addEventListener("touchmove", e => { e.preventDefault(); touchPos(e); }, { passive: false });
  stage.addEventListener("touchend", e => { e.preventDefault(); if (e.touches.length === 0) { touching = false; dashTouch = false; } }, { passive: false });
  stage.addEventListener("touchcancel", () => { touching = false; dashTouch = false; });

  requestAnimationFrame(frame);
})();
