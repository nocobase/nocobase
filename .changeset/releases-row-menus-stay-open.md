---
'@nocobase/app-plugin-releases': patch
---

A row's menu in the releases plugin's lists no longer closes by itself when the list renders again, such as when other data on the page loads: the lists' cells are no longer remounted on every render.
