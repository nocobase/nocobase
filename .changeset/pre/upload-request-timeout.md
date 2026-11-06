---
'@nocobase/app-server': patch
---

Give a request ten minutes to arrive instead of Node's five, so a large upload over a slow link is no longer cut off with HTTP 408.
