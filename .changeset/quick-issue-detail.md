---
"@nocobase/app-plugin-projects": patch
"@nocobase/app-server": patch
---

Avoid computing application progress for browser issue details and parallelize independent detail reads. Let applications own project cache refreshes and keep request logs free of duplicate route fields.
