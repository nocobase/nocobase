---
name: nocobase-app-plugin-i18n
description: "Use when adding or changing user-facing text in a NocoBase application or plugin: writing locale files, wiring a package's locales for the first time, translating a component or a menu title, naming a namespace, translating server responses, errors and outbound mail, or adding a language. Not for building page UI around the text (nocobase-app-development) or scaffolding a new plugin (nocobase-plugin-development); those Skills hand translation work here."
argument-hint: '[action: add-text|add-locale|translate-component|override-plugin-text] [target-file-or-package]'
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
owner: i18n
version: 1.0.0
last-reviewed: 2026-09-30
risk-level: low
metadata:
  domain-owner: '@nocobase/app-plugin-i18n'
  current-scope: 'applications generated from app-template-default, and the plugins they install'
---

# Goal

Put user-facing text behind a translation key correctly the first time: in the right file, under the right namespace, and in a way that survives a language switch.

# Scope

- Wire locale files into a package that has none yet.
- Add a string to an application or a plugin and render it translated, in the browser or on the server.
- Throw an error that callers see in their own language, and translate mail or jobs for their recipient.
- Add a language to a package that already has locale files.
- Reword a plugin's copy from the application, without editing the plugin.
- Translate a menu or breadcrumb title.

# Non-Goals

- Do not build a language picker. `useAppLocale()` exists; `app-template-default` already renders one in `client/layouts/components/language-switcher.tsx`.
- Do not add i18n machinery to an application. The plugin is registered by default, the client runtime is built by `createAppI18nRuntime`, and the server's by `I18nProvider`.
- Do not configure the list of languages. It is whatever the application's own `locales/index.ts` declares; configuration names only the default, `i18n.defaultLocale` (overridden by `APP_DEFAULT_LOCALE`). The `@nocobase/app-plugin-i18n` README covers that, `useAppLocale()`, the endpoints, and `useSyncServerLocale()`, which the template shell already calls to keep the server's language in step with the browser's.

# The one rule that decides everything

**A namespace is a package name, and the namespace in scope follows the render tree.**

An application's pages get the application's namespace; a plugin's pages get that plugin's, because the host wraps each contribution using the `packageName` it already records. So a component in its own package's routes translates with no namespace at all.

The exception is what most mistakes come from: a component a plugin exports for the application to render is in the _application's_ scope, not its own. It has to name its namespace.

# Procedure

## Wiring locales into a package for the first time

A package has a `client/locales/` and a `server/locales/` tree, each with an `en-US.ts`, the other languages, and an `index.ts` mapping every language to a dynamic import:

```ts
// client/locales/index.ts, and server/locales/index.ts in the same shape
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};

export default locales;
```

Import that module and pass it as `locales`, the same way on both sides:

```ts
// client/plugin.ts
import locales from './locales/index.js';

export default defineClientPlugin({
  packageName: '@acme/app-plugin-orders',
  locales,
  routes,
});
```

```ts
// server/plugin.ts
import locales from './locales/index.js';

export default defineServerPlugin({
  baseDir,
  packageName: '@acme/app-plugin-orders',
  locales,
});
```

Import it statically. Each language is already a separate dynamic import, so a language is loaded only when something needs it; deferring the map as well gains nothing. `locales: () => import('./locales/index.js')` is still accepted on both sides for code written that way.

Without this step every `t()` in the package renders its key. An application's own `client/runtime.ts` and `server/runtime.ts` pass their locales the same way.

## Adding a string

1. Find the package that owns the text. Application text goes in `client/locales/`; a plugin's text goes in that plugin's `client/locales/`.
2. Add the key to `en-US.ts`. The structure is written once: the type is derived from the value with `LocaleResource<typeof enUS>`, and other locales are annotated with it, which is what makes a typo a compile error.
3. Add the translation to every other locale file. A missing key falls back rather than breaking, so this can lag, and `typecheck` reports it.
4. Render it with `useTranslation` from `@nocobase/i18n/client`.

```tsx
import { useTranslation } from '@nocobase/i18n/client';

const { t } = useTranslation();
t('actions.save');
```

Keys nest and are addressed with dots: `t('trigger.types.schedule')`.

## Naming translation keys

Use short semantic keys that describe the purpose of the text and stay valid when its wording changes. Use lower camelCase within each segment and dots for useful feature or context groups, such as `files.uploadFailed` or `demo.pageDescription`. A small namespace may use `title` directly. Do not use complete English sentences as keys or merely convert a sentence into camelCase.

| Purpose              | Prefer                        | Avoid                                       |
| -------------------- | ----------------------------- | ------------------------------------------- |
| Page heading         | `orders.title`                | `Order list`                                |
| Empty state          | `orders.empty`                | `orders.noOrdersHaveBeenCreatedYet`         |
| Upload error         | `files.uploadFailed`          | `File upload failed.`                       |
| Demo explanation     | `demo.pageDescription`        | `This page demonstrates the plugin.`        |
| Action versus status | `actions.open`, `status.open` | Sharing `open` just because both say “Open” |

Follow existing semantic groups and reuse keys only for the same meaning and translation context. Prefer nested objects for new groups; do not restructure existing flat dotted keys or rename unrelated keys solely for consistency. Keep the package name in the namespace, not repeated inside each key.

Variables belong in translated values, not in keys. i18next plural suffixes `_one` and `_other` are exceptions to camelCase:

```ts
// client/locales/en-US.ts; mirror these keys in the other locales.
const enUS = {
  files: { uploadFailed: 'Could not upload {{name}}.' },
  selection: {
    count_one: '{{count}} item selected',
    count_other: '{{count}} items selected',
  },
};
```

```tsx
const NS = '@acme/app-plugin-files';
const { t } = useTranslation(NS);
t('files.uploadFailed', { name: file.name });
t('selection.count', { count: selectedItems.length });
```

Keep keys stable when only wording changes. A key rename must update all locales, callers, route navigation/breadcrumb titles, and dynamic lookups together. Preserve custom labels and unknown server messages as fallback text. Type checking checks locale shape; review key naming separately.

## Naming a namespace

Only in these two cases:

**A component rendered outside its own package's routes.** Ask: will this render anywhere other than this plugin's own pages? If yes:

```tsx
const { t } = useTranslation('@nocobase/app-plugin-workflow');
```

Keep the namespace in one constant per package rather than repeating the literal.

**Reaching for the application's wording deliberately.** A plugin cannot write the application's package name — the user chose it — so use the sentinel:

```tsx
import { APP_NS } from '@nocobase/i18n';

t('save', { ns: APP_NS });
```

This is rarely needed. `t('save')` already falls back to the application's namespace when the plugin has no such key.

## Menu and breadcrumb titles

Routes are declared before any language is known, so a route carries the key, not the text. Write a key from the owning package's locale file in `navigation.title` and `breadcrumb.title`:

```ts
defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'nav.orders', icon: ShoppingCart },
    breadcrumb: { title: 'nav.orders' },
    componentLoader: () => import('./pages/orders-page.js'),
  },
]);
```

The navigation and breadcrumbs translate the title in the namespace of the package that declared the route, so no namespace is written. A title with no matching key renders as written, which is how a missing key shows up.

## Translating on the server

Server text lives in the package's `server/locales/`, wired as above, and is translated in the language of whoever it is for.

Inside a request, the i18n middleware has already resolved the language (session choice, then `Accept-Language`, then the default) and loaded it:

```ts
import { getRequestTranslator } from '@nocobase/i18n/server';

const NS = '@acme/app-plugin-orders';

router.get('/orders/:id', async (context) => {
  const t = getRequestTranslator(context, NS);
  return context.json({
    message: t('orders.archived', { id: context.req.param('id') }),
  });
});
```

For an error the caller should see in its own language, throw an `AppI18nError` instead of translating a message. It carries a stable code, the namespace, the key and the parameters; it is translated only when it is serialized, and the payload keeps `ns`, `key` and `params` so the browser can re-render it in the language its interface is showing:

```ts
import { AppI18nError } from '@nocobase/i18n/server';

throw new AppI18nError('ORDER_NOT_FOUND', {
  status: 404,
  ns: NS,
  key: 'errors.notFound',
  params: { id },
});
```

Outside a request — a queue job, cron, mail, a notification — there is no request language. Resolve the runtime from the container, load the recipient's language, and bind the translator to it. The namespace comes first:

```ts
import { i18nToken } from '@nocobase/app-server/i18n';

const i18n = container.resolve(i18nToken);
await i18n.ensureLocaleLoaded(recipient.locale);
const t = i18n.getFixedT(NS, recipient.locale);

await sendMail(recipient.email, {
  subject: t('mail.orderShipped', { id: order.id }),
});
```

How an error boundary serializes `AppI18nError`, and where a job without a container should translate, are in the `nocobase-plugin-development` Skill's `references/i18n.md` and the `@nocobase/i18n` README.

## Adding a language

1. Copy `en-US.ts` to the new locale, annotate it with the type `en-US.ts` exports, and translate the values. Use `PartialLocaleResource<typeof enUS>` while a translation is deliberately incomplete.
2. Add the loader to `locales/index.ts`:

   ```ts
   const locales: LocaleLoaders = {
     'en-US': () => import('./en-US.js'),
     'zh-CN': () => import('./zh-CN.js'),
     'ja-JP': () => import('./ja-JP.js'),
   };
   ```

3. Add the locale to the application's own `client/locales/index.ts` and, when translating server content, `server/locales/index.ts`. Keeping both lists aligned is recommended. A client-only language can still be selected: the server uses English and the application shows an informational toast. Those files decide each side's offered languages; a plugin supplies translations rather than adding languages to the picker.

Do this in every package that ships locales, or the new language shows a mix: packages that have it translated, and packages falling back to English.

## Rewording a plugin's text

From the application's locale file, keyed by the plugin's package name:

```ts
const zhCN: AppResource = {
  actions: { save: '保存' },
  overrides: {
    '@nocobase/app-plugin-workflow': {
      trigger: { title: '触发条件' },
    },
  },
};
```

Overrides apply after every namespace has registered, so the application always wins. Do not edit the plugin's own locale file for this — an upgrade would overwrite it.

# Rules

- **Never concatenate translated fragments.** Word order differs by language. Use interpolation: `t('greeting', { name })` against `'Hello {{name}}'`.
- **Test with the real runtime, not a mocked `t`.** Render components under `TestI18nProvider` with a runtime from `createTestI18nRuntime` (`@nocobase/i18n/testing`), built from the package's own locale files. It is strict by default, so a key missing from the fallback chain fails the test even when a `defaultValue` would have hidden it. Pass `defaultValue` only where a tree may genuinely render with no runtime mounted.
- **The loader key must be a runtime value.** `locales['en-US']()` written as a literal lets a bundler drop every other language from the build.
- **Outside a request, load the locale first.** In a queue job or cron, `await i18n.ensureLocaleLoaded(locale)` before translating. Skipping it does not throw; translations quietly fall back.
- **`getFixedT` takes the namespace first.** `getFixedT(NS, locale)`; the other order binds a locale as a namespace and translates nothing.
- **Do not branch on a translated message.** Compare an error's `code`; its `message` changes with the language.
- **Outbound content follows its recipient.** Mail and notifications take an explicit locale — the recipient's, not the locale of whoever triggered the work.

# Verification

```bash
pnpm typecheck                    # a key absent from the interface
pnpm nocobase locales check      # a language declared on only one side
pnpm test                         # if application text changed
```

Run these from the application. Inside this monorepo the equivalents are `pnpm --filter <package> typecheck` and `pnpm --filter <app> exec nocobase locales check`. The root `pnpm i18n:check` is a different check: it reads every `locales/` directory under `packages/` and reports keys missing from a locale, without comparing the languages each side declares.

Then switch language in the running application and confirm the new text follows. A string that does not change is still a literal somewhere.

# References

This Skill is copied into each application that installs the plugin, so the packages are named rather than linked by path — where they resolve to depends on whether you are in this repository or in a generated application.

- `@nocobase/i18n` README — namespaces, the fallback chain, server-side translation, error payloads
- `@nocobase/app-plugin-i18n` README — the switch itself, the default language, endpoints, `useAppLocale`, `useSyncServerLocale`, and the session-stored language shared across tabs
