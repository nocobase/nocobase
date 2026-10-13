---
'@nocobase/acp-bridge': minor
---

Add `@nocobase/acp-bridge`, which makes a person's computer a place where their agent sessions run: signed in as that person, `runBridge` registers the computer with the agents it found (Codex through `codex-acp`, OpenCode through `opencode acp`), long-polls the application for commands, runs each session's agent over the Agent Client Protocol with full access in the directories the person allowed, lists the computer's folders for a person choosing one, and reports what it does. `@nocobase/acp-bridge/protocol` is the wire protocol between the bridge and `@nocobase/app-plugin-agent-sessions`, with no Node dependency, so the application's server and browser read it too.
