---
'@nocobase/app-plugin-foundation': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Interrupt background foundation scans during application shutdown, drain active database reads, and resume the saved scan after restart. Reuse application fixtures in template client tests while keeping users, sessions, permissions, and business data isolated.
