---
"@nocobase/create-app": patch
"@nocobase/app-skills": patch
---

Clarify that the commercial multi-app template creates Main only and children are added on demand. Keep the template alias while removing multi-application scaffolding and appDirectories processing. Main consumes child deployment archives rather than source directories.

Move multi-app scenario Skills out of the shared application guidance package; they are distributed by the commercial multi-app plugin.
