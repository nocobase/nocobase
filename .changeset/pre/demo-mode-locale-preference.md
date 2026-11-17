---
'@nocobase/app-plugin-demo-mode': patch
'@nocobase/app-plugin-users': patch
---

Keep a demo visitor's language choice in their own browser session instead of the shared demo account. Demo Mode now isolates the `i18n.locale` preference that the language switcher saves, replacing the unused `locale` key, and Users shares that key between its client and server.
