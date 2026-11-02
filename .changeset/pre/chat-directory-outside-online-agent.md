---
'@nocobase/app-plugin-agents': patch
---

Read the chat Agent directory directly from the conversation service without changing the HTTP response or eligibility checks. Remove `chatAgents` from the OnlineAgent service, runtime contract, and constructor dependencies; server callers should use `conversations.chatAgents(userId)` instead.
