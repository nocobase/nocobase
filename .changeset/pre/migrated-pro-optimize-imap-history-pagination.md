---
'@nocobase/app-plugin-mail': patch
---

Use date-scoped IMAP UID searches for initial mailbox history so sparse UID spaces do not require scanning empty ranges before the configured received-after boundary.
