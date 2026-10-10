---
'@nocobase/app-template-default': minor
---

Register `@nocobase/app-plugin-api-keys` so an application generated from either template can issue API keys out of the box.

Both halves are wired: the server plugin for the `apikey` table and the Settings page in the client plugin list, plus `apiKey()` in `server/config/auth.ts` and `apiKeyClient()` in `client/config/auth.ts`. Registering only one half is the failure worth knowing about — the plugin list alone creates the table and mounts no endpoints, and the auth config alone mounts endpoints against a table that does not exist.

The page declares `page:api-keys/access`. Keys are self-service and every endpoint acts only on the caller's own, so an application normally grants it to all authenticated users.
