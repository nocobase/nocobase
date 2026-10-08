---
'@nocobase/app-plugin-mail': patch
---

Normalize core mail folders across IMAP, Gmail, and Microsoft providers, and group SMTP sent messages with IMAP replies using RFC reply headers when provider conversation IDs are unavailable, including existing stored messages.
