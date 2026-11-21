# Installation (PWA) upgrades

Read this when the target template adds the `pwa` configuration section, `server/config/pwa.ts`, `createPwaRoutes()` in `server/app.ts`, `mountInstallLinks()` in `client/service-provider.ts` or `public/assets/pwa-{192,512}.png`. The behavior is described in [installing as an app](../../nocobase-app-development/references/pwa.md).

## Applications without their own installation

Reconcile the four sources like any template change: add `pwa` to `server/config/index.ts`, register `app.addRoutes(createPwaRoutes())` in `server/app.ts` immediately before `app.addRoutes(spaRootRoutes)`, not in `server/routes/index.ts`, whose contributions Foundation analyzes as business routes, merge the mount and unmount into the application's own `client/service-provider.ts` without dropping its customizations, and copy the two icons. Replace the icons with the application's brand when it has one, under new file names. The name follows `client.app.title`; set `pwa.name` or `pwa.shortName` only when the installed name must differ.

## Applications that already serve a manifest

Some applications, such as NocoBase Studio and Customer Portal, built their own manifest route, link and icons, often with `pushManifest` from the Web Push plugin. Moving them to the shared implementation is optional and scheduled with that application's own release; nothing changes until its owner does it. Keep the installed identity, or users end up with a second installed app and lose their push subscriptions:

- Keep the same public base path and origin. `id`, `start_url` and `scope` stay `<publicBasePath>/`, exactly what `pushManifest` produced.
- Keep the manifest at `<publicBasePath>/manifest.webmanifest`; if the old route used another path, keep that path linked or redirect it until installed clients have refreshed.
- Move the branding into `pwa` (name, shortName, colors, icon paths), then remove the application's own manifest route, link-mounting code and duplicate icons in the same change. `mountInstallLinks()` skips a manifest the page already links, so a leftover link silently wins.
- Leave the Web Push worker alone: `<publicBasePath>/push-worker.js`, its scope and the VAPID key do not change, so existing subscriptions keep working. Replace `pushManifest` imports with `pwaManifest` from `@nocobase/app-server/spa` when convenient; the alias keeps working meanwhile with the same `id`, `start_url`, `scope` and relative icon URLs. Only absolute `http(s)` icon URLs change: they are kept as they are instead of being prefixed with the base path, which never resolved.

## Web Push in the templates

When the target template also installs `@nocobase/app-plugin-notification-web-push`, apply it as one change: the dependency in `package.json`, the plugin in `server/plugins.ts` and `client/plugins.ts`, `push` (`pushConfig`) in `server/config/index.ts`, the `webPush` channel in `server/config/notification.ts`, `client/layouts/components/push-notifications-dialog.tsx`, and the account-menu item and sign-out `unsubscribeDevice` call in `user-menu.tsx`, merged into the application's own menu. The plugin's migration adds the `webPushSubscriptions` table. Push stays "not configured" until `push.privateKey` is set; an application that already has a key, such as one configured for its own push integration, keeps it so existing subscriptions keep working. An application that already shows its own device settings keeps one entry rather than adding a second. Nothing is sent until business code sends to the channel.

## Verify

Fetch `<publicBasePath>/manifest.webmanifest` signed out and compare `id`, `start_url`, `scope` and icon URLs with the previous release; open each icon URL; with `CDN_BASE_URL` builds, check that both still come from the application server as JSON and PNG, not the SPA page. In a browser, confirm the application is still offered for installation, or that an already installed app opens in its own window without a second install. Record real-device Android and iOS checks separately from desktop and emulated ones.
