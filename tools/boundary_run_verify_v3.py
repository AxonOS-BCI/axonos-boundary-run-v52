#!/usr/bin/env python3
# AxonOS Boundary Run v52 — replay-proof verifier (independent re-simulation).
# Created by Denis Yermakou, Founder & CEO of AxonOS.
# SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AxonOS-Commercial
#
# Faithful Python port of the deterministic gameplay core in src/game.js.
# Re-runs an exported proof's input log from its seed and confirms the canonical
# SHA-256 hash matches proof["hash"]. Same seed + same input log => same hash, in
# a different language. Exact IEEE-754 arithmetic only (no transcendentals).
import argparse, json, hashlib, math, sys

W = 960
FIELD_TOP, FIELD_BOT = 66, 540 - 16
AUDIT0, AUDIT1 = 318, 398
FAST0, FAST1 = 92, 172
PW, PH = 30, 32
ACC, FRICT, VMAX, STOP = 1.25, 0.80, 7.2, 0.06
DASH_CD, DASH_IFRAMES, DASH_KICK, DASH_VMAX = 100, 15, 7.0, 11.0
M32 = 0xFFFFFFFF

def imul(a, b): return (a * b) & M32

def rnd(s):
    s["rng"] = (s["rng"] + 0x6D2B79F5) & M32
    t = s["rng"]
    t = imul(t ^ (t >> 15), t | 1) & M32
    t = (t ^ ((t + imul(t ^ (t >> 7), t | 61)) & M32)) & M32
    return ((t ^ (t >> 14)) & M32) / 4294967296.0

def clamp(v, a, b): return a if v < a else b if v > b else v

def make_hazard(s, x):
    r = rnd(s)
    typ = "artifact"
    if r > 0.86: typ = "vault"
    elif r > 0.70: typ = "raw"
    elif r > 0.55: typ = "gate"
    w = 30 + math.floor(rnd(s) * 22)
    h = 34 + math.floor(rnd(s) * 26)
    y = FIELD_TOP + 8 + math.floor(rnd(s) * (FIELD_BOT - FIELD_TOP - h - 16))
    vy = (rnd(s) * 2 - 1) * 0.9
    return {"x": float(x), "y": float(y), "w": w, "h": h, "type": typ, "vy": vy, "hit": False, "passed": False}

def new_sim(seed):
    s = {"seed": seed & M32, "rng": seed & M32, "tick": 0,
         "x": 150.0, "y": 300.0, "vx": 0.0, "vy": 0.0,
         "integrity": 100.0, "consent": "Granted", "suspend": 0,
         "score": 0.0, "distance": 0.0, "combo": 0, "bestCombo": 0, "mult": 1,
         "dashCd": 0, "iframes": 0, "spawnIn": 0.0, "hazards": [], "over": False, "inputLog": []}
    for i in range(6):
        s["hazards"].append(make_hazard(s, W + 140 + i * 175))
    return s

def aabb(px, py, h):
    return px + PW > h["x"] and px < h["x"] + h["w"] and py + PH > h["y"] and py < h["y"] + h["h"]

def step_sim(s, mask):
    if s["over"]:
        return
    s["tick"] += 1
    s["inputLog"].append(mask & 31)

    ax = 0.0; ay = 0.0
    if mask & 1: ax -= 1
    if mask & 2: ax += 1
    if mask & 4: ay -= 1
    if mask & 8: ay += 1
    s["vx"] += ax * ACC
    s["vy"] += ay * ACC
    if ax == 0:
        s["vx"] *= FRICT
        if abs(s["vx"]) < STOP: s["vx"] = 0.0
    if ay == 0:
        s["vy"] *= FRICT
        if abs(s["vy"]) < STOP: s["vy"] = 0.0
    s["vx"] = clamp(s["vx"], -VMAX, VMAX)
    s["vy"] = clamp(s["vy"], -VMAX, VMAX)

    if s["dashCd"] > 0: s["dashCd"] -= 1
    if s["iframes"] > 0: s["iframes"] -= 1
    if (mask & 16) and s["dashCd"] <= 0:
        s["iframes"] = DASH_IFRAMES; s["dashCd"] = DASH_CD
        dx = (1 if mask & 2 else 0) - (1 if mask & 1 else 0)
        dy = (1 if mask & 8 else 0) - (1 if mask & 4 else 0)
        if dx == 0 and dy == 0: dx = 1
        s["vx"] = clamp(s["vx"] + dx * DASH_KICK, -DASH_VMAX, DASH_VMAX)
        s["vy"] = clamp(s["vy"] + dy * DASH_KICK, -DASH_VMAX, DASH_VMAX)

    s["x"] = clamp(s["x"] + s["vx"], 22, W * 0.6)
    s["y"] = clamp(s["y"] + s["vy"], FIELD_TOP + 2, FIELD_BOT - PH)
    for v in (s["x"], s["y"], s["vx"], s["vy"]):
        if not math.isfinite(v):
            s["over"] = True; s["consent"] = "Withdrawn"; return

    if s["suspend"] > 0:
        s["suspend"] -= 1
        if s["suspend"] == 0 and s["consent"] == "Suspended": s["consent"] = "Granted"

    surge = (s["tick"] % 1500) < 240
    speed = (2.6 + min(3.4, s["tick"] / 2400)) * (1.35 if surge else 1)
    s["distance"] += speed

    cy = s["y"] + PH / 2
    in_audit = AUDIT0 <= cy <= AUDIT1
    in_fast = FAST0 <= cy <= FAST1
    s["mult"] = 2 if in_fast else 1
    if s["consent"] == "Granted":
        if in_audit: s["integrity"] = min(100, s["integrity"] + 0.10)
        if in_fast: s["integrity"] = max(0, s["integrity"] - 0.04)
        s["score"] += speed * 0.10 * s["mult"] * (1.5 if surge else 1)

    for h in s["hazards"]:
        h["x"] -= speed
        h["y"] += h["vy"]
        if h["y"] < FIELD_TOP + 4:
            h["y"] = FIELD_TOP + 4; h["vy"] = -h["vy"]
        elif h["y"] > FIELD_BOT - h["h"] - 4:
            h["y"] = FIELD_BOT - h["h"] - 4; h["vy"] = -h["vy"]

        if not h["hit"] and aabb(s["x"], s["y"], h):
            h["hit"] = True
            if h["type"] == "vault":
                if s["consent"] == "Granted":
                    s["integrity"] = min(100, s["integrity"] + 12); s["combo"] += 1
                    if s["combo"] > s["bestCombo"]: s["bestCombo"] = s["combo"]
                    s["score"] += 50 + s["combo"] * 8
            elif s["iframes"] > 0:
                if h["type"] == "raw": s["score"] += 22 * s["mult"]
                elif h["type"] == "artifact": s["score"] += 11 * s["mult"]
                # gate: phase through harmlessly
            elif h["type"] == "raw":
                s["integrity"] -= 18; s["combo"] = 0
            elif h["type"] == "artifact":
                s["integrity"] -= 7; s["combo"] = 0
            elif h["type"] == "gate":
                if s["consent"] != "Withdrawn":
                    s["consent"] = "Suspended"; s["suspend"] = 180
        if not h["hit"] and not h["passed"] and (h["x"] + h["w"]) < s["x"]:
            h["passed"] = True
            if (h["type"] == "raw" or h["type"] == "artifact") and s["consent"] == "Granted":
                gap = min(abs((h["y"] + h["h"]) - s["y"]), abs(h["y"] - (s["y"] + PH)))
                if gap < 16: s["score"] += 12 * s["mult"]

    s["hazards"] = [h for h in s["hazards"] if h["x"] + h["w"] > -24]
    s["spawnIn"] -= speed
    if s["spawnIn"] <= 0:
        s["hazards"].append(make_hazard(s, W + 30 + rnd(s) * 70))
        s["spawnIn"] = (78 if surge else 165) + rnd(s) * 120 - min(95, s["tick"] / 38)

    if s["integrity"] <= 0 and not s["over"]:
        s["integrity"] = 0; s["over"] = True; s["consent"] = "Withdrawn"

def jsround(x): return math.floor(x + 0.5)

def canonical(s):
    return ("brv3:" + str(s["seed"]) + ":" + str(s["tick"]) + ":" + str(math.floor(s["score"])) +
            ":" + str(jsround(s["integrity"])) + ":" + s["consent"] + ":" + ",".join(str(m) for m in s["inputLog"]))

def main():
    ap = argparse.ArgumentParser(description="Verify a Boundary Run v52 replay proof by independent re-simulation.")
    ap.add_argument("proof_json")
    args = ap.parse_args()
    with open(args.proof_json, "r", encoding="utf-8") as f:
        proof = json.load(f)
    for k in ("seed", "inputLog", "hash"):
        if k not in proof:
            print("FAIL: missing field", k); sys.exit(1)
    log = [int(m) & 31 for m in proof["inputLog"]]
    s = new_sim(int(proof["seed"]) & M32)
    for m in log:
        step_sim(s, m)
    got = hashlib.sha256(canonical(s).encode("utf-8")).hexdigest()
    ok = (got == proof["hash"])
    print("ticks      :", s["tick"], "(proof:", proof.get("ticks"), ")")
    print("score      :", math.floor(s["score"]), "(proof:", proof.get("score"), ")")
    print("integrity  :", jsround(s["integrity"]), "(proof:", proof.get("integrity"), ")")
    print("consent    :", s["consent"], "(proof:", proof.get("consent"), ")")
    print("hash match :", ok)
    if not ok:
        print("FAIL: re-simulated hash does not match proof"); print("  expected:", proof["hash"]); print("  got     :", got); sys.exit(1)
    print("OK: replay proof verified by independent Python re-simulation")

if __name__ == "__main__":
    main()
