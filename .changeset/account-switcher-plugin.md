---
'@nocobase/app-plugin-account-switcher': minor
'@nocobase/app-plugin-authentication': minor
'@nocobase/app-cli': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Add `@nocobase/app-plugin-account-switcher`, which lets a Super Admin act as another account and return from the account menu during development. It is on while `NODE_ENV` is `development` and off otherwise, and the templates register it. An older application adds it with `pnpm nocobase plugin register`, a `server/config/account-switcher.ts` section and `AccountSwitchMenu` in its account menu, as the plugin's Skill describes. Authentication gains `Auth.addSessionSubstitution`, through which a plugin makes a signed-in session act as another user on every route, on realtime connections and in `/get-session`. `pnpm dev` now runs the application server with `NODE_ENV=development` unless the environment sets it, so development no longer reports the single-process fallbacks of the job, queue and concurrency services as warnings.
