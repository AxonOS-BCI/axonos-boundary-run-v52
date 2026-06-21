#!/usr/bin/env python3
# Created by Denis Yermakou, Founder & CEO of AxonOS.
from pathlib import Path
import sys, re
root = Path(__file__).resolve().parents[1]
forbidden = [r"fetch\s*\(", r"XMLHttpRequest", r"WebSocket", r"sendBeacon", r"serviceWorker", r"navigator\.serviceWorker"]
violations = []
scan_roots = [root / "index.html", root / "src"]
paths = []
for item in scan_roots:
    if item.is_file(): paths.append(item)
    elif item.is_dir(): paths.extend([p for p in item.rglob("*") if p.is_file()])
for path in paths:
    if path.suffix.lower() not in {".html", ".js", ".css", ".json"}: continue
    text = path.read_text(errors="ignore")
    for pat in forbidden:
        if re.search(pat, text):
            violations.append((str(path.relative_to(root)), pat))
if violations:
    print("FAIL: forbidden network/security patterns detected")
    for item in violations: print(" -", item[0], item[1])
    sys.exit(1)
required = ["README.md", "ATTRIBUTION.md", "SECURITY.md", "DONATIONS.md", "docs/TRACEABILITY_MATRIX.md", "docs/AxonOS_Boundary_Run_v52_Technical_Specification.md"]
missing = [p for p in required if not (root / p).exists()]
if missing:
    print("FAIL: missing required files", missing)
    sys.exit(1)
print("OK: Boundary Run v52 static audit passed")


# Hardening assertions added for v52 release blockers.
def _hardening_assertions():
    from pathlib import Path
    idx = Path("index.html").read_text(encoding="utf-8", errors="replace")
    game = Path("src/game.js").read_text(encoding="utf-8", errors="replace")
    rel = Path("scripts/create_github_release_v52.sh").read_text(encoding="utf-8", errors="replace")
    lic = Path("LICENSE-AGPL").read_text(encoding="utf-8", errors="replace")
    assert "Content-Security-Policy" in idx
    assert "no-referrer" in idx
    assert "replace(/[^a-f0-9]/gi" in game
    assert "WebCrypto SHA-256 unavailable" in game
    assert "touchstart" in game
    assert "git tag -fa" not in rel
    assert "pkg install" not in rel
    assert "GNU AFFERO GENERAL PUBLIC LICENSE" in lic

_hardening_assertions()
