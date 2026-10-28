---
'@nocobase/app-plugin-agents': patch
'@nocobase/agent-runner': patch
---

Show a conversation's new messages and replies sooner. An accepted message is announced with its `seq`, so every page that shows the conversation reads it at once instead of waiting for the run's next announcement. The chat reads lists and details once per burst of announcements instead of once per announcement. The runner sends the first words of a reply preview after 50 ms and later text every 200 ms, instead of holding text for up to a second.
