---
"@nocobase/app-plugin-agents": patch
"@nocobase/app-template-examples": patch
---

Allow idle OnlineAgent conversations to switch models without starting a new conversation. Show a model-only picker for existing native chats, preserve conversation configuration and drafts, and prevent sends while a model change is being saved or reconciled.

Keep unspecified model restrictions absent instead of replacing them with a default-model allowlist. Treat omitted and explicit empty lists as unrestricted while preserving their distinct stored shapes, and retain nonempty business restrictions when switching models.
