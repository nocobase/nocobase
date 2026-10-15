---
'@nocobase/studio': patch
---

Fix chat submission on HTTP origins by generating UUID v4 message correlation IDs with crypto.getRandomValues instead of the secure-context-only crypto.randomUUID.
