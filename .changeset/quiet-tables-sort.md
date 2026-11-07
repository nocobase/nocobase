---
'@nocobase/db': patch
---

Avoid redundant NULL ordering expressions for non-nullable table fields so ordered queries can use ordinary indexes.
