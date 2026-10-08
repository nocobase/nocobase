---
'@nocobase/app-plugin-ai-employee': patch
---

Answer a send refused at the parallel conversation limit with the limit message instead of a SQL error: the refused user message is now saved with only its stored columns, so the `key` the chat sends with it no longer reaches the insert.
