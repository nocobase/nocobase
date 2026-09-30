# @nocobase/app-plugin-i18n

Language switching for a NocoBase application.

The mechanism — namespaces, resource loading, translation — lives in [`@nocobase/i18n`](../../libs/i18n/README.md) and works whether or not this plugin is installed. What this adds is the part a user operates: the endpoints that record which language to answer in, and the hook a picker is built on. An application without it still translates; it simply cannot change language at runtime.

## Registration

`pnpm nocobase plugin register i18n` writes both entries. They amount to:

```ts
// client/plugins.ts
import i18n from '@nocobase/app-plugin-i18n/client';

defineClientPlugins([i18n()]);
```

```ts
// server/plugins.ts
import i18n from '@nocobase/app-plugin-i18n/server';

defineServerPlugins([i18n]);
```

The available languages come from the application rather than from the plugin, and they are not configured: an application offers whichever languages its own `client/locales/index.ts` and `server/locales/index.ts` declare loaders for. Adding a language means adding its file.

A plugin's locale file supplies translations for those languages; it never adds one. A plugin shipping `ja-JP` to an application that does not offer Japanese contributes nothing a visitor can select — which is what keeps an installed plugin from putting an unexpected language in the picker.

Configuration names only which of them the application starts in:

```yaml
# config.yml
i18n:
  defaultLocale: zh-CN
```

It defaults to `en-US`, and `APP_DEFAULT_LOCALE` overrides it. A default the application does not translate is ignored rather than offered.

## Building a picker

The plugin exports the behaviour, not the control. How a picker looks belongs to the application, which owns its component library and its design:

```tsx
import { useAppLocale } from '@nocobase/app-plugin-i18n/client';

const { locale, locales, setLocale, switching } = useAppLocale();
```

Both `useAppLocale()` and `useSyncServerLocale()` must run inside `AppClientRoot`. They use `useApiClient()` to send requests through the current application's shared API client, including its configured `api.baseURL` and request hooks. Tests rendering these hooks must provide application context too.

| Field       | Meaning                                                                                |
| ----------- | -------------------------------------------------------------------------------------- |
| `locale`    | The language currently in use                                                          |
| `locales`   | Every available language, each with a `label` in its own language and a `direction`    |
| `setLocale` | Switches language and returns `{ locale, requestedLocale, fallback }` from the server  |
| `switching` | True while resources load and the server request is pending, for disabling the control |

A label reads as short as stays unambiguous — "中文" rather than "中文（中国）" — and keeps the region only when two enabled languages share a language and the region is what tells them apart.

`app-template-default` builds its picker in `client/layouts/components/language-switcher.tsx`; copy it as a starting point.

## What a switch does

`setLocale(next)` runs the whole chain:

1. Loads every registered namespace's resources for the new language, in parallel
2. Changes the interface language, which i18next broadcasts; the application runtime updates `<html lang>` and `<html dir>`
3. Writes `localStorage`, so a refresh cannot lose the choice
4. Tells the server which language was selected and returns its result

Step 1 waits for every namespace together, so the interface switch is atomic: no frame renders half-translated. **Plugins need no code to follow a switch** — one i18next instance serves every namespace, and `useTranslation` subscribes to it.

The interface remains in the selected language when the server does not support it. The server stores `en-US` and returns `fallback: true`; the template shows an informational toast using its client locale messages. An unsupported locale is a normal result, not an HTTP error. Transport failures reject `setLocale` and populate `error` without undoing the browser's choice, so a custom control must handle the rejection and tell the user that server synchronization failed.

## Keeping the server in step

The browser is the source of truth for what it renders; the server keeps its own copy so it can answer in the right language. They drift apart routinely — a different browser, an expired session, a switch made in another tab.

`useSyncServerLocale()` sends the browser's language once at startup to reconcile them. It does not block rendering.

## Endpoints

```
GET  /api/i18n/locales   → { defaultLocale, locales: [{ locale, label, direction }] }
POST /api/i18n/locale    { locale } → { locale, requestedLocale, fallback }
```

Both sit under the application's base path, so an application served from `/main` answers at `/main/api/i18n/locale`. `POST` stores the requested language when supported and otherwise stores English (`en-US`), even if the configured default is another language. Missing or invalid locale values still return HTTP 400. What the server offers follows from the application's `server/locales/`; keeping it aligned with `client/locales/` is recommended, but a client-only language is allowed and does not prevent switching.

**A known limit:** the language is stored on the session, so tabs sharing an account overwrite each other. Tab A switching to Chinese means tab B's requests also come back in Chinese while its interface is still English. Error payloads carry `ns`, `key`, and `params` alongside the translated `message`, so a frontend can render errors in its own interface language regardless of what the session says.
