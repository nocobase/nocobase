---
'@nocobase/app-plugin-agents': patch
---

Add `ChatSubmissions.restore()` so an application can put back a message an existing conversation refused before writing it, for example after a page reload, without sending it again.
