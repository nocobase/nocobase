---
'@nocobase/audit': minor
'@nocobase/logging': minor
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Rotate audit JSON Lines files by UTC date and configurable size, and remove archives after a configurable retention period. Existing file paths become prefixes for dated, numbered segments. The previous unsegmented files stay in place.
