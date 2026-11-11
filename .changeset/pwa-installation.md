---
"@nocobase/app-server": minor
"@nocobase/app-client": minor
"@nocobase/app-plugin-notification-web-push": patch
"@nocobase/app-template-default": minor
"@nocobase/app-template-examples": minor
"@nocobase/app-skills": patch
---

Applications can be installed from the browser to the desktop or home screen and open in their own window. `@nocobase/app-server/spa` adds `definePwaConfig()`, `createPwaRoutes()` and `pwaManifest()`: a `pwa` configuration section (`enabled`, `name`, `shortName`, `description`, `themeColor`, `backgroundColor`, `icons`, `appleTouchIcon`; `APP_PWA_ENABLED`) and an anonymous `<publicBasePath>/manifest.webmanifest` whose `id`, `start_url`, `scope` and icons follow the public base path. The name defaults to `client.app.title`. Only `pwa.enabled` and `pwa.appleTouchIcon` are published to the browser. `@nocobase/app-client` adds `mountInstallLinks()`, which links the manifest and Apple touch icon and removes only the links it added.

The Default and Examples templates register the section and route, link the manifest from `client/service-provider.ts` and ship `public/assets/pwa-192.png` and `pwa-512.png`. Installation needs HTTPS or localhost and no Web Push configuration, notification permission or sign-in; it adds no service worker and no offline cache. With `CDN_BASE_URL`, the manifest and icons are still served by the application server.

`pushManifest` and its types in `@nocobase/app-plugin-notification-web-push` are now deprecated aliases of `pwaManifest` with unchanged output for existing callers; the push worker path and scope do not change. This version of the plugin needs an `@nocobase/app-server` that exports `pwaManifest`, so upgrade both together.

Existing applications adopt it through the template upgrade: add `server/config/pwa.ts` to `server/config/index.ts`, put `createPwaRoutes()` first in `server/routes/index.ts`, merge the `mountInstallLinks()` mount and unmount into `client/service-provider.ts`, and copy the icons. Applications that already serve their own manifest keep their installed identity by keeping the same base path and manifest URL; the `nocobase-app-upgrade` Skill describes the migration.
