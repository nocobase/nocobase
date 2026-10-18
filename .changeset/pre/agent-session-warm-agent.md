---
'@nocobase/acp-bridge': minor
'@nocobase/app-plugin-agent-sessions': minor
---

A new session's first message takes over the agent its choices were discovered with, instead of starting another. The new-session page chooses the session's id with the draft and names it in `discoverChoices` (`sessionId`); the bridge runs that discovery's agent with the session's environment and keeps it, with its open ACP session, for up to five minutes and at most one per computer, and the session created with that id applies its own choices to it and prompts it. While a session's agent opens, the bridge reports what it is doing (`startup`: starting the agent, opening its session, applying settings), stored as `agentSessions.startup` and shown on the session page. Both protocol fields are optional, so older bridges and applications keep working as before.
