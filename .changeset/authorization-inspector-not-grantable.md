---
'@nocobase/app-plugin-authorization': patch
---

The permission inspector is no longer a settings item, so role editors no longer offer it as a grantable permission; its routes still require `settings:authorization.inspector` `inspect`, which unrestricted roles hold.
