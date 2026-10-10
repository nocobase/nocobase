---
"@nocobase/app-plugin-dag-flow": patch
---

Require the workflow manage permission for all management HTTP APIs and page entry points. Return localized HTTP 403 responses for unauthorized users while preserving root access. Existing read grants must be explicitly replaced with manage grants by an administrator.
