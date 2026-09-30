---
'@nocobase/app-plugin-ai-employee': patch
---

Cancel a pending throttled message update when an AI chat stops listening to a conversation. The update used to fire after the chat unmounted, which reached React after the page, or a test environment, had already been torn down.
