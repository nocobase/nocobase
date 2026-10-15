---
'@nocobase/studio': patch
---

Prevent the split task list from entering a render loop when an optimistic follow preference changes before its grouped rows refresh. Keep the selected task usable while following or unfollowing, then move it into the updated group.
