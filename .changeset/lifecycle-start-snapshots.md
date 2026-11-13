---
'@nocobase/lifecycle': minor
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-examples': patch
---

Isolate parameter configuration by definition version and freeze complete instance parameters atomically at the explicit start boundary. Keep retries, continuations and trigger deadlines on the original snapshot, and protect unsaved version configuration.


Require an independently persisted unstarted proof for configured drafts. The existing creation-receipt table is now required for submission-start definitions even without a client request ID; creation writes the proof and first start consumes it atomically. Historical records without reliable proof or recoverable startup parameters stop migration instead of being treated as fresh drafts.


Recover incomplete historical snapshots only when the first startup is proven. Gaps or inconsistent history stop migration rather than using a later retained submission's parameters, while complete snapshots remain preserved.


Backfill authoritative unstarted proofs for untouched legacy drafts, preflight all conflicts before configuration or DDL writes, and keep migration numbering after merged history. Custom LifecycleStore adapters must implement findRecords for bounded primary-key batch reads before upgrading.
