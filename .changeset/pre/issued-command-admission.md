---
"@nocobase/app-plugin-authentication": patch
"@nocobase/app-plugin-agents": patch
"@nocobase/app-plugin-knowledge": patch
"@nocobase/app-plugin-projects": patch
"@nocobase/app-plugin-releases": patch
---

Allow applications to define issued-credential admission consistently with their command policies. Support run-authenticated project creation, activity and label reads, issue uploads and project resources. Restrict comment edits and deletions to the authenticated originating run, and accept run credentials when reading a release.

Apply the same trusted application admission to knowledge and owner-checked conversation routes without bypassing their business permissions or ownership checks.

Check issue visibility before collecting plan rehearsal baselines so a refused row cannot disclose hidden issue fields or dependency identifiers.
