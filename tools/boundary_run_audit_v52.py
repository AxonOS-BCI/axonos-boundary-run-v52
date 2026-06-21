#!/usr/bin/env python3
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
required = ["README.md", "SECURITY.md", "DONATIONS.md", "docs/TRACEABILITY_MATRIX.md", "docs/AxonOS_Boundary_Run_v52_Technical_Specification.md"]
missing = [p for p in required if not (root / p).exists()]
if missing:
    print("FAIL: missing required files", missing)
    sys.exit(1)
print("OK: Boundary Run v52 static audit passed")
