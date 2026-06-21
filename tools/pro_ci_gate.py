#!/usr/bin/env python3
"""AxonOS Boundary Run v52 — 57 Pro CI gates.
Created by Denis Yermakou, Founder & CEO of AxonOS.
"""
from __future__ import annotations
import re, subprocess, sys
from pathlib import Path
ROOT = Path.cwd()
DOGE = "DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp"
LAUNCH = "https://axonos-bci.github.io/axonos-boundary-run-v52/"

def read(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        raise SystemExit(f"missing file: {path}")
    return p.read_text(encoding="utf-8", errors="replace")
def exists(path: str):
    if not (ROOT / path).exists(): raise SystemExit(f"missing file: {path}")
def contains(path: str, s: str):
    if s not in read(path): raise SystemExit(f"missing {s!r} in {path}")
def run(cmd: list[str]):
    subprocess.run(cmd, cwd=ROOT, check=True)

def no_forbidden_network():
    forbidden = ["fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon", "analytics", "googletagmanager"]
    for path in ["index.html", "src/game.js", "src/styles.css"]:
        data = read(path)
        for f in forbidden:
            if f in data:
                raise SystemExit(f"forbidden network/telemetry primitive {f} in {path}")

def safe_release():
    s = read("scripts/create_github_release_v52.sh")
    if "git tag -fa" in s or "git push -f origin \"$TAG\"" in s or "git push --force origin \"$TAG\"" in s:
        raise SystemExit("force tag operation detected")
    if "pkg install" in s or "apt install" in s or "brew install" in s:
        raise SystemExit("auto-install detected in release script")
    for phrase in ["Tag $TAG already exists", "gh auth status", "git ls-remote"]:
        if phrase not in s: raise SystemExit(f"safe release guard missing: {phrase}")

def gate(name: str):
    if name == "readme_launch": contains("README.md", LAUNCH)
    elif name == "attribution": run(["bash", "scripts/verify_attribution.sh"])
    elif name == "donation_wallet": run(["bash", "scripts/verify_donation_address.sh"])
    elif name == "no_service_worker": run(["bash", "scripts/verify_no_sw.sh"])
    elif name == "no_telemetry": no_forbidden_network()
    elif name == "no_external_cdn":
        for path in ["index.html", "src/game.js", "src/styles.css"]:
            if re.search(r"https?://", read(path)): raise SystemExit(f"external URL in {path}")
    elif name == "csp_present": contains("index.html", "Content-Security-Policy")
    elif name == "referrer_policy": contains("index.html", "no-referrer")
    elif name == "safe_release_script": safe_release()
    elif name == "no_force_tag": safe_release()
    elif name == "no_auto_install": safe_release()
    elif name == "full_agpl":
        contains("LICENSE-AGPL", "GNU AFFERO GENERAL PUBLIC LICENSE")
        contains("LICENSE-AGPL", "END OF TERMS AND CONDITIONS")
    elif name == "proof_sanitize": contains("src/game.js", "replace(/[^a-f0-9]/gi")
    elif name == "crypto_error": contains("src/game.js", "WebCrypto SHA-256 unavailable")
    elif name == "nan_guard": contains("src/game.js", "Number.isFinite")
    elif name == "touch_controls": contains("src/game.js", "touchstart")
    elif name == "foundation_status": contains("README.md", "Implementation Status")
    elif name == "version_file": contains("VERSION", "52.0.0")
    elif name == "license_files": [exists(x) for x in ["LICENSE-AGPL", "LICENSE-COMMERCIAL"]]
    elif name == "security_policy": contains("SECURITY.md", "security@axonos.org")
    elif name == "governance_doc": exists("GOVERNANCE.md")
    elif name == "contributing_doc": exists("CONTRIBUTING.md")
    elif name == "code_of_conduct": exists("CODE_OF_CONDUCT.md")
    elif name == "trademark_policy": exists("TRADEMARK.md")
    elif name == "third_party_notices": exists("THIRD_PARTY_NOTICES.md")
    elif name == "traceability_matrix": exists("docs/TRACEABILITY_MATRIX.md")
    elif name == "technical_spec": exists("docs/AxonOS_Boundary_Run_v52_Technical_Specification.md")
    elif name == "release_notes": exists("RELEASE_NOTES_v52.0.0.md")
    elif name == "changelog": exists("CHANGELOG.md")
    elif name == "source_manifest": exists("SOURCE_MANIFEST.sha256")
    elif name == "build_script": exists("scripts/build_web.sh")
    elif name == "audit_script": exists("tools/boundary_run_audit_v52.py")
    elif name == "smoke_script": exists("qa/boundary-run-static-smoke-v52.mjs")
    elif name == "donation_verifier": exists("scripts/verify_donation_address.sh")
    elif name == "attribution_verifier": exists("scripts/verify_attribution.sh")
    elif name == "no_sw_verifier": exists("scripts/verify_no_sw.sh")
    elif name == "repro_script": exists("scripts/reproducibility_check.sh")
    elif name == "package_script": exists("scripts/package_release.sh")
    elif name == "dependabot": exists(".github/dependabot.yml")
    elif name == "pages_branch_workflow": exists(".github/workflows/pages-branch-deploy.yml")
    elif name == "old_pages_removed":
        if (ROOT/".github/workflows/pages.yml").exists(): raise SystemExit("old pages.yml still present")
    elif name == "workflow_yaml_shape": exists(".github/workflows/pro-ci-57.yml")
    elif name == "release_tag": contains("VERSION", "52.0.0")
    elif name == "launch_url": contains("README.md", LAUNCH)
    elif name == "zero_backend_claim": contains("README.md", "no backend")
    elif name == "privacy_claim": contains("README.md", "zero-telemetry")
    elif name == "consent_mechanics": contains("src/game.js", "Withdrawn")
    elif name == "replay_proof": contains("src/game.js", "finalizeProof")
    elif name == "keyboard_controls": contains("README.md", "A/D")
    elif name == "canvas_runtime": contains("index.html", "<canvas")
    elif name == "mobile_viewport": contains("index.html", "viewport")
    elif name == "accessibility": contains("index.html", "aria-label")
    elif name == "security_contact": contains("SECURITY.md", "security@axonos.org")
    elif name == "commercial_license": contains("LICENSE-COMMERCIAL", "Commercial")
    elif name == "no_secrets":
        data = "\n".join(read(p) for p in ["index.html", "src/game.js", "package.json"])
        if re.search(r"(ghp_|github_pat_|AKIA[0-9A-Z]{16})", data): raise SystemExit("secret-like token found")
    elif name == "static_audit": run(["python3", "tools/boundary_run_audit_v52.py"])
    elif name == "static_smoke": run(["node", "qa/boundary-run-static-smoke-v52.mjs"])
    else: raise SystemExit(f"unknown gate: {name}")
    print(f"OK: {name}")

if __name__ == "__main__":
    gate(sys.argv[1])
