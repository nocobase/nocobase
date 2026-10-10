---
'@nocobase/logging': minor
'@nocobase/app-server': minor
'@nocobase/app-host': minor
'@nocobase/app-plugin-hub': minor
'@nocobase/app-plugin-dag-flow': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-skills': patch
---

Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

Route HTTP request logs to separate request files by default in all application templates.
