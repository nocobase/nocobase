---
'@nocobase/app-cli': patch
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-skills': patch
---

Respect the configured public origin during local development instead of overriding it with a loopback address. Explain rejected sign-in origins with actionable English and Chinese messages, and document verification of the browser-facing address and authentication request.
