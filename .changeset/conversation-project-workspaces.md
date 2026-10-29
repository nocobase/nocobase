---
"@nocobase/app-plugin-agents": minor
"@nocobase/app-plugin-projects": patch
---

Allow applications to supply project workspaces for Runner conversations, retain their runner when changing agents, and continue from the latest conversation summary. Project selection is frozen after the first message. Project access checks can use the caller's transaction connection.

Reject Agent changes when the conversation’s bound project runner cannot run the selected Agent, preserving its workspace and queued work.
