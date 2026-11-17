---
'@nocobase/app-host': patch
'@nocobase/app-plugin-releases': patch
---

Allow configuring checksum and extraction worker deadlines through host.artifactWorker.timeoutMs, with a 120000 ms default and startup validation of the supported timer range.
