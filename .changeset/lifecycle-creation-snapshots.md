---
'@nocobase/lifecycle': minor
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-examples': patch
---

Freeze complete, version-specific lifecycle parameters atomically with record creation, including business drafts. Keep instance parameters unchanged during edits, submissions, retries, continuations and worker restarts, and calculate state deadlines from state entry using the creation snapshot.

Remove the deferred snapshot boundary and independent startup-proof mechanism while retaining creation request idempotency. Reject missing or invalid instance snapshots without reading current configuration. Preflight complete historical payloads before configuration or schema writes, prefer reliable creation evidence, and supplement formerly live historical parameters once from their bound version's upgrade-time configuration. Preserve submitted thresholds and actual historical times; reject lost fixed snapshots or malformed evidence.

Update examples, parameter history, protected version editors and upgrade guidance. Custom LifecycleStore adapters must implement findRecords for bounded primary-key batch reads.

Recognize released per-source parameter revisions when recovering verified creation usage, preserve original group revisions and remove obsolete read modes from the recovered payload. Complete released partial submission snapshots only with their missing live fields, marking only upgrade-time additions as upgrade origin.

Expose default, configuration and upgrade parameter origins in schemas and instance details. Keep old definitions available and explicitly route new records to new behavior versions; old records can continue without waiting for completion.
