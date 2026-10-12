---
'@nocobase/app-server': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-skills': patch
---

Expose the application's resolved `NODE_ENV` to server providers without inheriting an embedded application's host process environment. Mail now warns once during production startup when its effective OAuth return URL still points to the legacy `/dev/mail/accounts` destination. The current root (`/`) default does not trigger the warning or register an account route: applications must register their own authenticated personal account page and configure `mail.oauthReturnUrl` to that page. This warning does not block startup, change configuration, or verify arbitrary client routes.
