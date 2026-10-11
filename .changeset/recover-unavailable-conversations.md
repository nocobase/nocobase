---
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
"@nocobase/app-plugin-agents": patch
---

Start a fresh conversation, with an instruction to recover context from the task, when a coding tool reports that the conversation it was asked to resume no longer exists, and report the new session so later runs resume it. Cancelled runs now also report their confirmed session.
