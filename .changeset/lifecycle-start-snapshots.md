---
'@nocobase/lifecycle': minor
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-examples': patch
---

Freeze complete, version-specific lifecycle parameters atomically with record creation, including business drafts. Keep instance parameters unchanged during edits, submissions, retries, continuations and worker restarts, and calculate state deadlines from state entry using the creation snapshot.

Remove the deferred snapshot boundary and independent startup-proof mechanism while retaining creation request idempotency. Reject missing or invalid instance snapshots without reading current configuration. Preflight complete historical payloads before configuration or schema writes, recover only from reliable creation evidence, and report historical submission-only evidence as a migration conflict with explicit operator choices.

Update examples, parameter history, protected version editors and upgrade guidance. Custom LifecycleStore adapters must implement findRecords for bounded primary-key batch reads.
