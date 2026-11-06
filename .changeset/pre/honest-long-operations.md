---
"@nocobase/app-template-default": patch
"@nocobase/app-plugin-file-example": patch
"@nocobase/app-plugin-jobs-example": patch
"@nocobase/app-plugin-realtime-example": patch
"@nocobase/app-skills": patch
---

Show long operations honestly: uploads show a delayed indeterminate wait with a long-wait note, real cancel and retry, and abort when the page closes; background jobs and exports show real progress or an indeterminate bar instead of an invented 0%, keep failures recoverable, say they continue after leaving the page and show where the result is.
