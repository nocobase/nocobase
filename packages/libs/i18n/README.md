# @nocobase/i18n

The internationalization runtime shared by NocoBase applications and plugins.

This package provides only the mechanism: namespaces, resource loading, locale resolution, and the bindings for React and Node. It registers no routes and knows nothing about users or sessions. Language switching — the picker, the endpoints behind it, the stored preference — belongs to [`@nocobase/app-plugin-i18n`](../../plugins/app-plugin-i18n/README.md). Translation works without that plugin; only changing language requires it.

## Entry points

| Entry                   | Contents                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `@nocobase/i18n`        | Isomorphic core: the i18next instance, namespace registry, locale resolution       |
| `@nocobase/i18n/client` | React bindings: `I18nProvider`, `NamespaceScope`, `useTranslation`, Refine adapter |
| `@nocobase/i18n/server` | Node bindings: request middleware, request translator, `AppI18nError`              |

The core depends on `i18next`; `/client` depends on `react-i18next` with `react` as a peer; `/server` takes `hono` as a peer. The entries are separate so a browser build never reaches `/server` and Node never reaches `/client`.

Most packages never import this directly. `defineClientPlugin` and `defineServerPlugin` accept the `locales/index.ts` module as `locales` and do the registration, so a plugin declares resources without naming this package. Import `/client` when a component needs to translate.

## Namespaces

A namespace is a package name. Nothing is declared and nothing collides, because npm already guarantees the names are unique.

| Source               | Namespace                       |
| -------------------- | ------------------------------- |
| The application      | its `package.json` name         |
| An official plugin   | `@nocobase/app-plugin-workflow` |
| A third-party plugin | `@acme/app-plugin-crm`          |

### The fallback chain

A key falls back along two axes, and they are independent. Across namespaces:

```
the current namespace  →  the application's  →  @nocobase/i18n
```

So a plugin writing `t('save')` reuses the application's wording without naming a namespace. Naming a namespace explicitly still falls back behind it. The last link, `@nocobase/i18n` (`BASE_NAMESPACE`), is reserved: this package ships no resources under it, so a key the application does not define either renders its `defaultValue` or its key.

A plugin cannot write the application's namespace as a literal — it is the user's own package name, chosen long after the plugin was published. `APP_NS` stands in for it and resolves when the translation runs:

```ts
import { APP_NS } from '@nocobase/i18n';

t('save', { ns: APP_NS });
```

The chain is passed to `getFixedT` as an ordered namespace list rather than through i18next's `fallbackNS`, which is read from instance options only — one instance serves every namespace here, and each needs its own chain. This is invisible to callers.

And across languages:

```
the language in use  →  the application's defaultLocale  →  en-US
```

The second step matters once an application offers a language its plugins have not translated. An application defaulting to `zh-CN` that adds `es-ES` leaves a plugin with neither, and falling back to the application's default alone would show a Spanish speaker Chinese; English is the one language that plugin almost certainly ships. Both fallback languages are loaded alongside the one in use, since a fallback only produces a translation when its resources are present to be read.

### Overriding a plugin's wording

An application reroutes a plugin's copy without touching its source, through an `overrides` block in its own locale file:

```ts
// client/locales/zh-CN.ts
export default {
  welcome: '欢迎',
  overrides: {
    '@nocobase/app-plugin-workflow': {
      trigger: { title: '触发条件' },
    },
  },
};
```

Overrides are applied after every namespace has registered, so the application always wins regardless of load order.

### The default namespace

`app-client` wraps each contribution in a `NamespaceScope` using the `packageName` it already records, so a plugin page translates with no arguments:

```tsx
import { useTranslation } from '@nocobase/i18n/client';

const { t } = useTranslation();
t('trigger.title'); // this package's own key
t('save'); // falls back to the application's key
t('label', { ns: APP_NS }); // named explicitly
```

**A component a plugin exports for the application to render sits in the application's scope, not its own.** The scope follows the render tree, not code ownership. Such a component names its namespace explicitly, or wraps itself with `withNamespace(NS, Component)`. The test: will this render outside its own plugin's routes? Then name the namespace.

## Resources

### Files

A locale file is a TypeScript module. `en-US` is the source of truth: it states the wording, and `LocaleResource` derives the shape from it so nothing is written twice. Other locales are annotated with that type, which reports both a key that does not exist and one that was left out:

```
client/locales/
├── index.ts      the locale-to-loader map
├── en-US.ts      exports the interface, and the resource typed by it
└── zh-CN.ts      const zhCN: XxxResource = { ... }
```

```ts
// en-US.ts
import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  language: { label: 'Language' },
};

export type AppResource = LocaleResource<typeof enUS>;
export default enUS;
```

```ts
// zh-CN.ts
import type { AppResource } from './en-US.js';

const zhCN: AppResource = {
  language: { label: '语言' },
};

export default zhCN;
```

Leaves widen to `string`, so a translation is not tied to the English wording. Use `PartialLocaleResource` for a language that is deliberately incomplete; a missing key falls back rather than breaking, but the plain type is what reports the omission.

Keys nest and are addressed with dots:

```ts
const enUS: WorkflowResource = {
  trigger: { title: 'Trigger', types: { schedule: 'Schedule' } },
};

t('trigger.types.schedule'); // 'Schedule'
```

`pnpm i18n:check` reports keys a locale is missing, without blocking development. It is this monorepo's own script and reads every `locales/` directory under `packages/`; an application built from a template runs `pnpm nocobase locales check` instead, which compares the languages its `client/locales/` and `server/locales/` declare.

### Loading

Client and server declare resources identically — a locale mapped to a dynamic import:

```ts
// client/locales/index.ts and server/locales/index.ts have the same shape
import type { LocaleLoaders } from '@nocobase/i18n';

const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};

export default locales;
```

Hand that module to `defineClientPlugin` and `defineServerPlugin` the same way on both sides — `import locales from './locales/index.js'` and then `locales` in the definition. The per-locale loaders are what keep resources lazy, so there is nothing to gain by deferring the map as well. A function importing it, `locales: () => import('./locales/index.js')`, is still accepted on both sides.

The browser loads only the language it is showing and fetches another on switch, keeping what it has already loaded. The server loads the default language at startup and lazy-loads another the first time it serves one.

Loading is per **language**, not per namespace: the navigation renders labels owned by every plugin, so their namespaces have to be present from the first frame regardless.

The key indexing the map must be a runtime value. `locales['en-US']()` written as a literal lets a bundler tree-shake the other languages away, leaving their chunks out of the build entirely.

### Which languages an application offers

**The application's own locale files are the list.** Whichever locales its `client/locales/index.ts` and `server/locales/index.ts` declare loaders for are the languages it offers, on each side respectively. There is no configured list to keep in step with them: adding a language means adding its file.

A plugin's locale file supplies translations, not languages. A plugin shipping `ja-JP` to an application that does not offer Japanese contributes nothing selectable — which is what keeps an installed plugin from putting an unexpected language in the picker. Conversely, an application offering a language does not mean every plugin has translated it; an untranslated namespace falls back.

Configuration names only the language the application starts in:

```yaml
# config.yml
i18n:
  defaultLocale: zh-CN
```

It defaults to `en-US`, and `APP_DEFAULT_LOCALE` overrides it. The default is always on offer, so a default the application does not translate still resolves — it simply falls back on every key. The browser reads this same value: there is one default locale for the application, not one per side.

On the server the list settles when the application's locale module registers during boot, which is after the i18n service is constructed. `getLocales()` is correct from that point on; a provider reading it during `register()` sees only the default.

## Server

### Request locale

`i18nHttpMiddleware` resolves the language and puts a translator on the context. Mount it after the session middleware, whose stored choice outranks `Accept-Language`:

```ts
app.addHttpMiddleware(i18nHttpMiddleware);
```

Resolution order: the session's stored locale → `Accept-Language` → `i18n.defaultLocale`. Each candidate is matched against the languages the application offers, so a browser asking for one it does not falls through rather than being honoured. The middleware awaits the locale's resources, so a handler can translate synchronously:

```ts
import { getRequestTranslator } from '@nocobase/i18n/server';

const t = getRequestTranslator(c, NS);
t('errors.notFound');
```

Omit the namespace to use the translator's application namespace. Passing one binds it as the default for that translator; an explicit `ns` on an individual call still overrides the binding. The accessor throws a wiring error if the i18n HTTP middleware has not run before the route.

### Outside a request

Queue jobs, cron, and webhooks have no request to read, and must load the locale themselves:

```ts
await i18n.ensureLocaleLoaded(user.appLang);
const t = i18n.getFixedT(NS, user.appLang);
t('job.failed', { name: workflow.title });
```

Skipping `ensureLocaleLoaded` does not throw. Translations quietly fall back to the key or the default language, which is easy to miss.

**Pass the locale explicitly for anything leaving the process.** The language of outbound content follows its recipient, not whoever triggered the work — a mail to A may well be triggered by B.

### Errors

`AppI18nError` carries what it needs to be translated rather than a message translated when it was thrown:

```ts
throw new AppI18nError('WORKFLOW_TRIGGER_INVALID', {
  ns: NS,
  key: 'errors.triggerInvalid',
  params: { field: 'name' },
});
```

Translation happens at serialization, where the request's locale is known, so one error object serves callers in different languages:

```jsonc
{
  "error": {
    "code": "WORKFLOW_TRIGGER_INVALID",
    "message": "触发条件配置无效：缺少 name 字段",
    "ns": "@nocobase/app-plugin-workflow",
    "key": "errors.triggerInvalid",
    "params": { "field": "name" },
  },
}
```

`message` is enough for an API-only application. A frontend can ignore it and re-render from `ns`, `key`, and `params` in whatever language its interface is currently showing.

## Key completion

Keys are suggested, not enforced. A plugin writing an application key is legitimate — the fallback chain exists for it — so the type stays open through `KnownKeys | (string & {})`: known keys complete, unknown ones do not error. `FlattenKeys<T>` turns a nested resource into its dotted paths.

Cross-namespace completion is not possible from a plugin, which cannot know the application's resource type at compile time.
