---
'@nocobase/app-cli': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Load the application's TypeScript compiler through a file URL so full Skills synchronization works on Windows, and preserve compiler loading errors instead of reporting them as a missing installation.

Use directory junctions and normalize glob paths in the application template tests so they run on Windows without elevated symbolic-link privileges.
