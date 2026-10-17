---
'@nocobase/app-plugin-agent-sessions': minor
---

A new session's first message no longer waits for the agent's choices to be discovered. Sent before they arrive, or after discovery failed, it carries only the settings the person chose, which the session checks before its first prompt, and the agent keeps its own defaults for the rest; sent once they have arrived, it carries every choice as shown, as before.
