---
'@nocobase/app-plugin-agents': patch
---

Clear a conversation's interrupted-stream state once it is idle and its history has caught up, and let a person's refresh conclude that a message whose send failed was never written, so it can be returned to the editor.
