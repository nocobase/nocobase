---
'@nocobase/app-skills': patch
'@nocobase/app-plugin-foundation': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Register the Foundation overview and capability guide as system settings pages. The overview moves to `/settings/foundation` with a redirect from its previous address, and capability guide links keep their existing URLs. Without `settingsGroup` the pages join the built-in System category.
