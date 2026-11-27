---
'@nocobase/audit': minor
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Rotate audit JSON Lines files by UTC date and configurable size with `rotating-file-stream`, and retain archives for at least the configured duration after the last write. Existing file paths become prefixes for dated, numbered segments. The previous unsegmented files stay in place.
