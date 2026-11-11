# Installing the application as an app

Browsers can install a NocoBase application to the desktop or home screen, where it opens in its own window. The official templates do this by default: the `pwa` configuration section, `createPwaRoutes()` in `server/app.ts`, `mountInstallLinks()` in `client/service-provider.ts`, and the icons `public/assets/pwa-192.png` and `public/assets/pwa-512.png`. Installation needs no Web Push plugin, push keys, notification permission or sign-in.

## What it serves

- `<APP_BASE_PATH>/manifest.webmanifest`, readable without signing in, `application/manifest+json`, revalidated on each use (`no-cache` with an ETag). It carries only the name, short name, description, colors and icons; never put anything private in those fields.
- `id`, `start_url` and `scope` are the application's public base path with a trailing slash (`/`, `/main/`, `/tenants/acme/crm/`), so every page of the application belongs to the installed app and a deep link opens inside it.
- The client links the manifest and the `apple-touch-icon` when the server publishes `pwa.enabled: true`; a page that already links its own keeps it. Nothing asks for notification permission.
- There is no service worker for installation and nothing is cached for offline use: the installed app is the same online application, updated by ordinary page loads. Do not add an empty worker, offline caching of API or business data, background sync or offline editing unless the user explicitly asks for that capability.

## Configuration

```yaml
# config.yml
pwa:
  enabled: true # APP_PWA_ENABLED=false turns installation off; the manifest then answers 404
  name: Acme Service Desk # defaults to client.app.title, then NocoBase
  shortName: Acme # the name under the icon; defaults to name
  description: Tickets and customers
  themeColor: '#002ad1'
  backgroundColor: '#ffffff'
  icons:
    - { src: assets/pwa-192.png, sizes: 192x192, type: image/png }
    - { src: assets/pwa-512.png, sizes: 512x512, type: image/png }
  appleTouchIcon: assets/pwa-192.png
```

Keep the application's name in `client.app.title` and leave `pwa.name` unset unless the installed name must differ, so the window title and the installed name do not drift. Icon paths are relative to the public base path or absolute `https://` URLs; paths with `..` or other schemes are refused at start. Provide at least a 192×192 and a 512×512 PNG.

Files under `public/assets/` are served with a one-year immutable cache. To change an icon, give the new file a new name (`pwa-192-v2.png`) and point the configuration at it rather than overwriting the old file.

## Deployment

- Installation requires HTTPS; `http://localhost` also works for development. Behind a reverse proxy, forward the full public base path unchanged.
- With `CDN_BASE_URL`, the manifest and the icons still come from the application server: the manifest is a server route and `dist/client/assets/` stays on the server, so an install never falls back to the SPA page or a sign-in redirect. Absolute icon URLs on a CDN also work.
- Moving the application to another public base path or origin creates a different installed app; users install it again.
- Chrome and Edge show an install button in the address bar; Android Chrome offers "Install app" or "Add to Home screen"; on iOS and iPadOS, Safari's Share → "Add to Home Screen" installs it. Browsers decide when to offer installation; there is no custom install prompt.

## Web Push

Push notifications come from a separate plugin, `@nocobase/app-plugin-notification-web-push`, which the official templates install and register with its `push` configuration, a `webPush` notification channel and a Push notifications item in the account menu. It works with or without installation, except on iOS and iPadOS, where the app must be installed before it can subscribe.

- Off until configured: without `push.privateKey` (`WEB_PUSH_PRIVATE_KEY`) the device settings say push is not configured, and the application, sign-in and installation work as usual. `pnpm nocobase config init` does not generate the key. Generate one per application with `openssl rand -hex 32` and keep it like the secrets keys: changing it makes every device subscribe again. Subscriptions are encrypted with the `secrets` keys, so those must be set too.
- Permission only on request: the browser's notification permission is requested only when the person presses Subscribe in those settings, never on page load, sign-in or installation. The plugin registers its own worker, `<APP_BASE_PATH>/push-worker.js`, at that moment; do not register another one.
- Each person manages only their own devices: subscribe, pause, remove and send a test notification. Signing out removes the current browser's device first and stops if that fails.
- Installing the plugin sends nothing. What to send, when and to whom is the application's business code, through the `webPush` channel of `@nocobase/app-plugin-notification`; read the plugin's Skill before writing it.

`pushManifest` from the plugin is a deprecated alias of `pwaManifest` from `@nocobase/app-server/spa`.
