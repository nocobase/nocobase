---
'@nocobase/app-plugin-projects': patch
---

Record a `relatedTo` link on both issues' activity when it is added, removed or converted, naming the other issue, and add the `activity.actions.relationAdded` and `activity.actions.relationRemoved` wording in every locale. A `blockedBy` dependency is still recorded only on the issue that waits.
