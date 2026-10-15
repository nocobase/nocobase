---
'@nocobase/studio': patch
---

Fix two regressions on the task pages: following a task with S in the split view no longer locks the page in a render loop (the list's follow state is no longer changed ahead of its groups; the follow star shows the change it is making instead), and the table's expanded sub-tasks no longer stay loading when the list changed while they were being read. Regenerate the CLI reference for `board wait`.
