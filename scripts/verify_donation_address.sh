#!/usr/bin/env bash
# Created by Denis Yermakou, Founder & CEO of AxonOS.
set -euo pipefail
EXPECTED="DMwHAhqVNWf7dyEznukxCufNS5rjuP5MTp"
ACTUAL="$(grep -Roh "$EXPECTED" DONATIONS.md README.md 2>/dev/null | head -n1 || true)"
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "DONATION ADDRESS MISMATCH: $ACTUAL"
  exit 1
fi
echo "OK: donation address verified"
