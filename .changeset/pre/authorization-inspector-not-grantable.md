---
'@nocobase/app-plugin-authorization': patch
---

The permission inspector is no longer a settings item, so role editors no longer offer it as a grantable permission. Its routes admit only an unrestricted identity, such as a holder of the root Permission Set, and refuse anyone else whatever settings they hold.
