# Security Policy

## Zero-telemetry security posture

Boundary Run v52 must not perform network communication during gameplay or proof export.

Forbidden APIs in source and build output:

- `fetch(`
- `XMLHttpRequest`
- `WebSocket`
- `sendBeacon`
- service worker registration
- external CDN script/style loading

## Reporting vulnerabilities

Report security issues to: `security@axonos.org`.

Project creator and maintainer: **Denis Yermakou**.

Coordinated disclosure target: 90 days.
Initial response target: 72 hours.

Do not include real neural data, private medical information, private keys, or secrets in an issue.


## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.
