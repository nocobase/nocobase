---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Clarify that default data scopes combine with role-granted scopes for users who already hold the operation permission, while restriction rules still constrain final access. Preserve all existing authorization configuration.
