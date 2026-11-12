# Operations Status — Honey Yemen

Updated: 2026-11-12

## Implemented on branch feat/real-hardware-runtime

- Added an Arduino Uno sketch for TCS34725 + GY-ML8511 (A0) + GY-906/MLX90614 using the documented START / COLOR_DATA / UV_DATA / IR_DATA protocol.
- Added a pySerial bridge that opens the configured Arduino serial port, sends START, validates COLOR_DATA / UV_DATA / IR_DATA and times out instead of inventing missing readings.
- Added a global hardware scan lock so only one scan can own the COM port at a time.
- Replaced HardwareService mock generator in the scan path with the serial bridge.
- Replaced the current AIService result with an explicit NOT_EVALUATED response until reference data and validation exist.
- New live RGB/UV/IR measurement records now persist in PostgreSQL through Prisma migrations; legacy demo/catalogue records remain in the separate JSON runtime store.
- PDF output is a raw technical measurement report, not a fake purity or ISO compliance certificate.
- Barcode verification now distinguishes a registered code from authenticity verification and masks legacy demo verdicts.
- Added a dedicated /verify?code=... route.
- Disabled demo login token issuance and unauthenticated merchant, SaaS admin, and checkout mutations.
- Product listing is gated on a sample record explicitly marked VERIFIED.
- Added .env examples, a safer local Docker Compose setup, a Windows startup script, runtime data migration away from the tracked seed file, .gitignore, PostgreSQL migrations, and CI jobs for backend/frontend builds, Prisma migrations, serial protocol, Arduino compile and PowerShell syntax.

## Not yet production-ready

- Application catalogue/configuration records remain in the ignored runtime JSON store. InfluxDB is provisioned by Compose but application time-series writes are not integrated.
- Authentication, password storage, JWT/session handling, first-admin provisioning and RBAC are not implemented. Sensitive writes have been disabled rather than left open.
- The new Arduino sketch still must be uploaded and validated against the exact physical modules, supply voltages, wiring, optical arrangement and calibration settings.
- Physical sensor acquisition has not been exercised against the user's device in this environment. CI parser tests and Arduino compile are added but have not yet been confirmed green.
- TCS34725 RGB, ML-8511 UV output and MLX90614 temperature do not directly measure sugar composition, moisture, HMF, density or prove authenticity.
- No reference sample dataset, calibration certificate, blinded validation report or approved classification model exists.
- Checkout UI and API mutations are disabled until payment, fulfillment and RBAC exist. No payment, order fulfillment, audit trail, backup restore drill, TLS deployment or production monitoring has been completed.

## Release gate

Do not expose the backend publicly or issue an authenticity certificate until persistence migration, authentication/RBAC, physical hardware tests, scientific validation, security review and end-to-end deployment checks pass.
