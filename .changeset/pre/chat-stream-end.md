---
'@nocobase/app-plugin-agents': patch
---

Keep a running chat response subscribed when a conversation read from before the current input still reports the conversation as idle, and report in `StreamState.finished` the response whose stream ended with the server's `finish`, so a stopped, cut-off or failed stream is no longer mistaken for a completed turn.
