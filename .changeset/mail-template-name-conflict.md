---
"@nocobase/app-plugin-mail": patch
---

Answer 409 `MAIL_TEMPLATE_ALREADY_EXISTS` instead of 500 when a user creates or renames a mail template to a name they already use, including concurrent requests.
