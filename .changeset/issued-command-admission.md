---
"@nocobase/app-plugin-authentication": patch
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-releases": patch
---

Allow applications to define issued-credential admission consistently with their command policies. Support run-authenticated project creation, activity and label reads, issue uploads and project resources. Restrict comment edits and deletions to the authenticated originating run, and accept run credentials when reading a release.
