---
"@nocobase/app-host": patch
"@nocobase/app-plugin-releases": patch
---

Avoid recycling a shared Host while applications are running or starting, and defer recycling when application status cannot be checked. Wait for a forcibly terminated Host process to exit before starting its replacement so late exit events cannot invalidate the new process.
