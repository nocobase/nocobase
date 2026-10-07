---
'@nocobase/app-plugin-authentication': patch
---

Show authentication errors in the person's language. The password sign-in, registration and reset actions now map the server's error code (Better Auth's, such as `INVALID_EMAIL_OR_PASSWORD`, its username plugin's, and this plugin's `ACCOUNT_DISABLED` and `SERVICE_ACCOUNT_NO_LOGIN`) to a message from the plugin's new `en-US` and `zh-CN` locales, report a rate limit and an unreachable server in their own words, and otherwise fall back to a generic localized message instead of the response's status text (a wrong password used to read "Unauthorized"). `AuthenticationActionError` gains an optional `code`. The plugin now declares `@nocobase/i18n` as a peer dependency, which applications already install.
