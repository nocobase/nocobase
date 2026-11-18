---
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Move the password-reset mailer reference from auth.email.mailer to auth.passwordReset.mailer. Update existing references directly; the old field is no longer accepted. Keep private inline SMTP/Resend settings, existing environment mappings, callbacks and default sender selection.
