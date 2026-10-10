---
'@nocobase/app-plugin-mail': patch
---

Add optional accountsHref and headerActions to MailWorkspacePage. Applications can link the empty and populated workspace to their own personal account page and append actions without replacing Compose or Sync. The public MailAccountsPage remains available for application-owned personal account routes; the plugin registers no built-in Dev, settings or management pages or routes. Applications must register and authorize their account page and configure mail.oauthReturnUrl separately to their account page; the current default returns to the application's root.
