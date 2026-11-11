---
'@nocobase/app-plugin-demo-mode': patch
---

Fix a blank application caused by Demo Mode matching routes nested in same-path groups, such as the default template's System settings categories, and skip that matching while Demo Mode is off.
