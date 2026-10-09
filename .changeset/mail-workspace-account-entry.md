---
'@nocobase/app-plugin-mail': patch
---

Add optional accountsHref and headerActions to MailWorkspacePage. Applications can link the empty and populated workspace to their own personal account page and append actions without replacing Compose or Sync. The Dev wrapper now supplies its own account path explicitly. Production applications must register and authorize their account page and configure mail.oauthReturnUrl separately.
