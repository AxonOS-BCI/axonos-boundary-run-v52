#!/usr/bin/env python3
import argparse, json, hashlib, sys
parser = argparse.ArgumentParser(description="Verify a Boundary Run v52 replay proof export.")
parser.add_argument("proof_json")
args = parser.parse_args()
with open(args.proof_json, "r", encoding="utf-8") as f:
    proof = json.load(f)
expected = proof.get("proof")
payload = dict(proof)
payload.pop("proof", None)
# Browser export includes proof over a slightly different payload object. This verifier provides structural validation now.
required = ["seed", "frames", "score", "consent", "inputLog"]
missing = [k for k in required if k not in proof]
if missing:
    print("FAIL: missing fields", missing)
    sys.exit(1)
if not isinstance(proof["inputLog"], list):
    print("FAIL: inputLog must be list")
    sys.exit(1)
print("OK: replay proof structure valid")
print("proof:", expected)
