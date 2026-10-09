---
'@nocobase/app-server': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-skills': patch
---

Expose the application's resolved `NODE_ENV` to server providers without inheriting an embedded application's host process environment. Mail now warns once during production startup when its effective OAuth return URL still points to the development-only account page. The compatible default remains unchanged: register an application-owned production account page and configure `mail.oauthReturnUrl` to it. This warning does not block startup, change configuration, or verify arbitrary client routes.
