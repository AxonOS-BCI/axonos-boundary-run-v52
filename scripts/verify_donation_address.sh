#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
EXPECTED="DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp"
for f in README.md DONATIONS.md index.html; do
  if ! grep -q "$EXPECTED" "$f"; then
    echo "DONATION ADDRESS MISSING FROM $f"
    exit 1
  fi
done
echo "OK: donation address verified in README.md, DONATIONS.md, and index.html"
