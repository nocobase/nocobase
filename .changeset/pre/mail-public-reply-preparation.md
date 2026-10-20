---
'@nocobase/app-plugin-mail': patch
---

Expose `prepareMailReply` and `MailComposerRequest` from the public client entry so custom pages can share the workspace's complete reply preparation, including incomplete-content loading and referenced inline-image uploads. Preserve existing recipient, subject, reply association and draft behavior. The browser-only helper does not open, save or send mail; callers retain loading, error and composer-session guards.
