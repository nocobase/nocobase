---
'@nocobase/app-plugin-agents': minor
---

A call to an OpenCode base URL (Zen or Go) carries `x-opencode-session` automatically, as OpenCode Go requires: the same session id for every model call of a conversation and a new one for each call outside any, so no service setting is needed. Every request to a provider names the plugin first in its user agent (`nocobase-agents/<version>`). The service form says which provider type serves which of OpenCode's model families.
