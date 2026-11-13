---
"@nocobase/app-cli-client": patch
"@nocobase/app-server": patch
---

Generate CLI operation keys in the existing web client's timestamp.UUID format so native mutation receipts accept default calls. Require declared length bounds to allow 50-character keys, reject incompatible UUID-only schemas, and document the native 24-hour retry window without changing server receipt validation.
