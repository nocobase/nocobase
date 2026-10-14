---
'@nocobase/app-plugin-agents': patch
'@nocobase/app-plugin-releases': patch
'@nocobase/db': patch
---

Fix MySQL installation of the agents and releases plugins by removing the unused directory/status index and limiting archive artifact keys to 172 characters while preserving full-value uniqueness. Add a Collection builder inspection method and forward migrations to converge existing installations without truncating data; oversized legacy artifact keys stop the upgrade before any column or index change. Rebuild the existing artifact-key unique index within the migration transaction on SQL Server so indexed legacy columns can be shortened while retaining uniqueness and nullable behavior.

This fix edits the released migrations `202610020003_ag_create_runs` and `202610020001_rel_create_tables` because their oversized indexes prevent fresh MySQL installations from reaching a later repair migration. Existing installations should expect checksum warnings on the next `nocobase db apply`; installations using `onChecksumMismatch: error` stop instead. After reviewing these exact changes, use `nocobase db repair --dry-run` and then `nocobase db repair` to acknowledge the new checksums, followed by `nocobase db apply` to perform the forward schema changes. Repairing checksums alone does not upgrade the schema. The forward corrections are irreversible because restoring the old indexes would make MySQL installations invalid again. See the plugins' `docs/mysql-installation-upgrade.md` for the upgrade and failed-installation recovery procedure.
