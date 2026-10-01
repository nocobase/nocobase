---
'@nocobase/app-plugin-ai-employee': patch
---

Fix an AI chat task that could be silently dropped when it was triggered right after the chat's employees and models loaded. The queued task was taken by an effect of an earlier render, whose stale model selection made the send abort, so the task's context was attached but nothing was sent.
