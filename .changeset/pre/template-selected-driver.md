---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Remove the default SQLite driver dependency from application templates. Application creation supplies the database driver selected by --dialect, defaulting to SQLite.
