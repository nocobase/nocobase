---
"@nocobase/agent-protocol": patch
"@nocobase/agent-runner": patch
"@nocobase/app-plugin-agents": patch
---

Start a fresh conversation with context recovery instructions when the requested conversation no longer exists, and report its session so later runs resume it. Claude checks its session file before opening the query, preserving immediate handling of startup errors. Cancelled runs now also report their confirmed session.
