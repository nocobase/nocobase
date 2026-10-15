---
'@nocobase/app-installer': minor
---

Preview migration and seed checksum changes before upgrade downtime and require explicit approval with `--repair-checksums <token>`. Back up SQLite history before repairing and restore it on failed, interrupted, or manually rolled-back upgrades, including upgrades with no pending migrations. Apply the same workflow to SSH deployments and report external databases that require operator restoration.

Upgrade preflight now requires the target application's `db repair --dry-run --json` support and refuses unreviewed checksum drift even with `--yes`. JSON errors expose `error.details.checksumRepair` with the exact changes and approval token; successful upgrades add `result.checksumRepairs`.

Checksum-repairing upgrades write installer state format 2 before modifying history, so older installers refuse recovery rather than skipping the restore. The new installer continues to read existing format 1 installations.
