---
'@nocobase/app-plugin-agent-sessions': patch
'@nocobase/app-plugin-file': patch
---

Allow explicit retries of unconfirmed agent messages without duplicating sessions, messages, commands or images. Commit a new session and its first message together, retain immutable browser submission input, and support file uploads within the caller's transaction.
