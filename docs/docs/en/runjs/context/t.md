# ctx.t()

An i18n shortcut function used in RunJS to translate text based on the current context's language settings. It is suitable for internationalizing inline copy such as buttons, titles, and prompts.

## Use Cases

`ctx.t()` can be used in all RunJS execution environments.

## Type Definition

```ts
t(key: string, options?: Record<string, any>): string
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Translation key or template with placeholders (e.g., `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Optional. Interpolation variables (e.g., `{ name: 'John', count: 5 }`), or i18n options (e.g., `defaultValue`, `ns`). |

## Return Value

- Returns the translated string. If no translation exists for the key and no `defaultValue` is provided, it may return the key itself or the interpolated string.

## Namespace (ns)

The **default namespace for the RunJS environment is `runjs`**. When `ns` is not specified, `ctx.t(key)` will look up the key in the `runjs` namespace.

```ts
// Looks up key from the 'runjs' namespace by default
ctx.t('Submit'); // Equivalent to ctx.t('Submit', { ns: 'runjs' })

// Looks up key from a specific namespace
ctx.t('Submit', { ns: 'myModule' });

// Searches multiple namespaces sequentially (first 'runjs', then 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Examples

### Simple Key

```ts
ctx.t('Submit');
ctx.t('No data');
```

### With Interpolation Variables

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dynamic Copy (e.g., Relative Time)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Specifying a Namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Notes

- **Localization Plugin**: To translate text, the Localization plugin must be activated. Missing translation keys will be automatically extracted to the localization management list for unified maintenance and translation.
- Supports i18next-style interpolation: Use `{{variableName}}` in the key and pass the corresponding variable in `options` to replace it.
- The language is determined by the current context (e.g., `ctx.i18n.language`, user locale).

## Related

- [ctx.i18n](./i18n.md): Read or switch languages