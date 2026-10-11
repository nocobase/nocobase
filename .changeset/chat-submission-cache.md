---
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Expose the chat query cache for application submission coordinators and keep conversation details and history current after sends. Explain unavailable header targets and query recovery conversations only when creation results are unknown. Keep upload tasks attached to their draft when an editor switches conversations, preserving pending sends across remounts.
