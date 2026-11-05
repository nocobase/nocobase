---
"@nocobase/app-client": patch
"@nocobase/app-plugin-i18n": patch
"@nocobase/app-plugin-users": minor
---

Persist signed-in users' explicit language choices across browsers and devices, isolate language changes across identities, and expose validated recipient language resolution for background jobs. Accounts without a saved language use the application default; unowned legacy browser choices are not imported. Preference caches are now scoped to the application mount path and authentication session.
