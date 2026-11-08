---
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Add a host-owned asynchronous ID generator factory lifecycle before database tasks, preserve manual generation, and close generation before database teardown. Application templates omit manual defaults in automatic mode and reject manual worker overrides there.
