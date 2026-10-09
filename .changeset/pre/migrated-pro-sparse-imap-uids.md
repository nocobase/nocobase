---
'@nocobase/app-plugin-mail': patch
---

Skip empty IMAP UID ranges during incremental sync so mailboxes with sparse UIDs complete without repeatedly scheduling empty pages.
