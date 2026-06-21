(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const ui = {
    integrity: document.getElementById("integrity"),
    consent: document.getElementById("consent"),
    weather: document.getElementById("weather"),
    proof: document.getElementById("proof"),
    live: document.getElementById("live"),
    codex: document.getElementById("codex"),
  };

  const W = canvas.width;
  const H = canvas.height;
  const FLOOR = 440;
  const Q = 65536;
  const weatherNames = ["Clear", "Overcast", "Storm", "Solar Flare", "Quantum Calm"];
  const lanes = [
    {name:"Safe Lane", kind:"safe", y:388, h:52},
    {name:"Audit Lane", kind:"audit", y:318, h:52},
    {name:"Fast Lane", kind:"fast", y:248, h:52},
  ];

  let keys = new Set();
  let paused = false;
  let colorblind = false;
  let frame = 0;
  let seed = 0xA50F0052;
  let inputLog = [];
  let hazards = [];
  let messages = [];
  let codexUnlocked = false;
  let state;

  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  let rng = mulberry32(seed);

  function reset() {
    frame = 0;
    seed = (Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) ^ 0xB0A5D52) >>> 0;
    rng = mulberry32(seed);
    inputLog = [];
    hazards = [];
    messages = [];
    codexUnlocked = false;
    paused = false;
    state = {
      x: 116 * Q,
      y: FLOOR * Q,
      vx: 0,
      vy: 0,
      lane: "safe",
      integrity: Q,
      consent: "Granted",
      score: 0,
      distance: 0,
      resumeVotes: 0,
      gameOver: false,
      proof: "pending"
    };
    for (let i = 0; i < 18; i++) spawnHazard(360 + i * 160);
    announce("Run started. Consent granted. Protect the choice.");
  }

  function spawnHazard(x) {
    const r = rng();
    let type = "artifact";
    if (r > 0.82) type = "raw";
    else if (r > 0.66) type = "gate";
    else if (r > 0.50) type = "beam";
    hazards.push({
      x, y: 246 + Math.floor(rng() * 170), w: 34 + Math.floor(rng() * 36), h: 48 + Math.floor(rng() * 58), type,
      phase: Math.floor(rng() * 360)
    });
  }

  function inputMask() {
    let m = 0;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) m |= 1;
    if (keys.has("ArrowRight") || keys.has("KeyD")) m |= 2;
    if (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space")) m |= 4;
    if (keys.has("ArrowDown") || keys.has("KeyS")) m |= 8;
    return m;
  }

  async function digest(text) {
    const data = new TextEncoder().encode(text);
    const h = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2,"0")).join("");
  }

  async function finalizeProof() {
    const payload = JSON.stringify({seed, frame, score: state.score, integrity: state.integrity, consent: state.consent, inputLog});
    const hash = await digest(payload);
    state.proof = hash.slice(0, 16);
    ui.proof.textContent = state.proof;
    return {seed, frames: frame, score: state.score, consent: state.consent, proof: hash, inputLog};
  }

  function announce(msg) {
    messages.unshift({msg, ttl: 180});
    messages = messages.slice(0, 4);
    ui.live.textContent = msg;
  }

  function weather() {
    const idx = Math.floor((seed + Math.floor(frame / 720)) % weatherNames.length);
    return weatherNames[idx];
  }

  function update() {
    if (paused || state.gameOver) return;
    frame++;
    const m = inputMask();
    inputLog.push([frame, m, state.integrity, state.consent]);
    if (inputLog.length > 7200) inputLog.shift();

    if (keys.has("KeyR") && state.consent !== "Withdrawn") {
      state.consent = "Withdrawn";
      state.gameOver = true;
      announce("Consent withdrawn. Terminal state reached.");
      finalizeProof();
    }
    if (keys.has("KeyE") && state.consent === "Suspended") {
      state.resumeVotes++;
      if (state.resumeVotes > 30) {
        state.consent = "Granted";
        state.resumeVotes = 0;
        announce("Dual-control resume accepted. Consent granted.");
      }
    }

    let ax = 0;
    if (m & 1) ax -= 5600;
    if (m & 2) ax += 5600;
    state.vx += ax;
    state.vx = Math.max(-350000, Math.min(350000, state.vx));
    state.vx = Math.trunc(state.vx * 0.88);
    if ((m & 4) && state.y >= FLOOR * Q) state.vy = -1040000;
    state.vy += 52000;
    state.y += state.vy;
    if (state.y > FLOOR * Q) { state.y = FLOOR * Q; state.vy = 0; }
    state.x += state.vx;
    state.x = Math.max(38 * Q, Math.min(330 * Q, state.x));

    const worldSpeed = 3.25 + Math.min(3.0, frame / 3600);
    state.distance += worldSpeed;
    state.score = Math.floor(state.distance + (state.integrity / Q) * 1000);

    for (const h of hazards) {
      h.x -= worldSpeed;
      if (h.x < -80) {
        h.x = W + 80 + rng() * 360;
        h.y = 232 + Math.floor(rng() * 205);
        h.type = ["artifact","gate","beam","raw","vault"][Math.floor(rng()*5)];
      }
      const px = state.x / Q, py = state.y / Q - 42;
      if (px + 24 > h.x && px - 24 < h.x + h.w && py + 44 > h.y && py < h.y + h.h) {
        collide(h);
      }
    }

    const lane = lanes.find(l => (state.y / Q) >= l.y - 54 && (state.y / Q) <= l.y + l.h + 62);
    state.lane = lane ? lane.kind : "safe";
    if (state.lane === "audit" && state.consent === "Granted") state.integrity = Math.min(Q, state.integrity + 24);
    if (state.lane === "fast") state.integrity = Math.max(0, state.integrity - 5);

    if (weather() === "Storm" && frame % 600 === 0 && state.consent === "Granted") {
      state.consent = "Suspended";
      announce("Kibo suspended consent: storm-induced policy drift.");
    }
    if (state.integrity <= 0 && !state.gameOver) {
      state.integrity = 0;
      state.gameOver = true;
      state.consent = "Withdrawn";
      announce("Integrity collapsed. Consent withdrawn.");
      finalizeProof();
    }
    if (!codexUnlocked && state.distance > 420) {
      codexUnlocked = true;
      ui.codex.textContent = "Consent FSM unlocked: Granted permits bounded operation; Suspended reduces exposure; Withdrawn is terminal and requires a fresh manifest install.";
      announce("Codex unlocked: Consent State Machine.");
    }
    for (const msg of messages) msg.ttl--;
    messages = messages.filter(m => m.ttl > 0);
  }

  function collide(h) {
    if (h.hitFrame === frame) return;
    h.hitFrame = frame;
    if (h.type === "artifact") { state.integrity -= 1800; state.vx = -180000; announce("Artifact spike: intent fidelity degraded."); }
    if (h.type === "raw") { state.integrity -= 5200; announce("Raw Signal Zone: simulated structural-privacy violation."); }
    if (h.type === "beam") { state.vx += 220000; state.integrity -= 900; announce("Stimulation beam: coercion vector detected."); }
    if (h.type === "gate") { state.consent = "Suspended"; announce("Stale consent gate: operation suspended until dual-control resume."); }
    if (h.type === "vault") { state.integrity = Math.min(Q, state.integrity + 3600); announce("Sealed Vault: privacy boundary intact."); }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#07101d"); g.addColorStop(1,"#020307");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    ctx.globalAlpha = .24;
    for (let x = 0; x < W; x += 32) { ctx.fillStyle = "#7aa7ff"; ctx.fillRect((x - (frame%32)), 0, 1, H); }
    for (let y = 0; y < H; y += 32) { ctx.fillStyle = "#7aa7ff"; ctx.fillRect(0, y, W, 1); }
    ctx.globalAlpha = 1;

    for (const l of lanes) {
      ctx.fillStyle = l.kind === "safe" ? "rgba(30,210,220,.18)" : l.kind === "audit" ? "rgba(80,220,130,.16)" : "rgba(230,170,60,.16)";
      ctx.fillRect(0, l.y, W, l.h);
      ctx.strokeStyle = l.kind === "safe" ? "rgba(30,210,220,.55)" : l.kind === "audit" ? "rgba(80,220,130,.50)" : "rgba(230,170,60,.50)";
      ctx.strokeRect(0, l.y, W, l.h);
      if (colorblind) {
        ctx.globalAlpha = .24;
        for (let x = 0; x < W; x += l.kind === "audit" ? 18 : 28) ctx.fillRect(x, l.y, 3, l.h);
        ctx.globalAlpha = 1;
      }
    }

    for (const h of hazards) drawHazard(h);

    const px = state.x / Q, py = state.y / Q;
    ctx.fillStyle = "#e7f4ff";
    ctx.beginPath(); ctx.arc(px, py - 34, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#c8ad6b";
    ctx.fillRect(px - 15, py - 16, 30, 44);
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 2; ctx.strokeRect(px - 15, py - 16, 30, 44);

    ctx.fillStyle = "#a7e6ff";
    ctx.beginPath(); ctx.arc(px - 38, py - 58 + Math.sin(frame/18)*6, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#a7e6ff"; ctx.beginPath(); ctx.arc(px - 38, py - 58 + Math.sin(frame/18)*6, 18, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,.42)"; ctx.fillRect(0,0,W,52);
    ctx.fillStyle = "#f4f7fb"; ctx.font = "700 18px ui-sans-serif";
    ctx.fillText(`Score ${state.score}`, 22, 33);
    ctx.fillStyle = state.consent === "Granted" ? "#79f0c0" : state.consent === "Suspended" ? "#f4c76b" : "#ff6b6b";
    ctx.fillText(`Consent ${state.consent}`, 154, 33);
    ctx.fillStyle = "#cbd7e5"; ctx.fillText(`Weather ${weather()}`, 360, 33);

    let y = 82;
    ctx.font = "600 16px ui-sans-serif";
    for (const m of messages) { ctx.fillStyle = `rgba(238,243,248,${Math.min(1, m.ttl/30)})`; ctx.fillText(`Kibo: ${m.msg}`, 22, y); y += 24; }

    if (paused) banner("PAUSED");
    if (state.gameOver) banner("RUN SEALED — PROOF GENERATED");

    ui.integrity.textContent = `${Math.max(0, Math.round(state.integrity / Q * 100))}%`;
    ui.consent.textContent = state.consent;
    ui.weather.textContent = weather();
  }

  function drawHazard(h) {
    const colors = {artifact:"#a879ff", raw:"#ff4c6d", beam:"#ffe16b", gate:"#95a0ac", vault:"#d6b45c"};
    ctx.fillStyle = colors[h.type] || "#fff";
    ctx.globalAlpha = h.type === "beam" ? .65 : .88;
    if (h.type === "beam") ctx.fillRect(h.x, 140, h.w, 320);
    else if (h.type === "gate") { ctx.fillRect(h.x, h.y, h.w, h.h); ctx.strokeStyle = "#fff"; ctx.strokeRect(h.x+4,h.y+4,h.w-8,h.h-8); }
    else if (h.type === "vault") { ctx.beginPath(); ctx.roundRect(h.x, h.y, h.w, h.h, 10); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(h.x, h.y+h.h); ctx.lineTo(h.x+h.w/2, h.y); ctx.lineTo(h.x+h.w, h.y+h.h); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  function banner(text) {
    ctx.fillStyle = "rgba(0,0,0,.66)"; ctx.fillRect(0, H/2 - 55, W, 110);
    ctx.fillStyle = "#fff"; ctx.font = "800 34px ui-sans-serif"; ctx.textAlign = "center"; ctx.fillText(text, W/2, H/2 + 12); ctx.textAlign = "left";
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  window.addEventListener("keydown", e => { keys.add(e.code); if (e.code === "KeyP") paused = !paused; if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault(); });
  window.addEventListener("keyup", e => keys.delete(e.code));
  document.getElementById("start").addEventListener("click", reset);
  document.getElementById("pause").addEventListener("click", () => paused = !paused);
  document.getElementById("colorblind").addEventListener("click", () => { colorblind = !colorblind; document.body.classList.toggle("colorblind", colorblind); });
  document.getElementById("export").addEventListener("click", async () => {
    const proof = await finalizeProof();
    const blob = new Blob([JSON.stringify(proof, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `boundary-run-v52-proof-${proof.proof.slice(0,12)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  reset();
  loop();
})();
