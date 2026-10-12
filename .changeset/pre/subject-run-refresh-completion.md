---
'@nocobase/app-plugin-agents': patch
---

Keep in-flight subject run requests when refresh signals arrive so slow responses can update the shared run cache instead of being repeatedly cancelled by discovery polling.
