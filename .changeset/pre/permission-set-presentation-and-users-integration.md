---
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Move default user permission-set integration into the Users plugin and remove duplicated template providers. Add application-owned preset title metadata for client-side localization without overwriting custom names. Preserve Hub's custom role scope and share searchable assignment selection between user creation and editing.
