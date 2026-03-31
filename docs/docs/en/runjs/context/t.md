# ctx.t()

i18n helper in RunJS for translating copy; uses the current context’s language. Use for buttons, titles, hints, etc.

## Use Cases

Available in all RunJS environments.

## Type

```ts
t(key: string, options?: Record<string, any>): string
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Translation key or template with placeholders (e.g. `Hello {{name}}`, `{{count}} rows`) |
| `options` | `object` | Optional. Interpolation (e.g. `{ name: 'John', count: 5 }`) or i18n options (`defaultValue`, `ns`) |

## Returns

- Translated string; if key has no translation and no `defaultValue`, may return the key or the interpolated string.

## Namespace (ns)

RunJS **default namespace is `runjs`**. Without `ns`, `ctx.t(key)` looks up the key in the `runjs` namespace.

```ts
ctx.t('Submit');  // same as ctx.t('Submit', { ns: 'runjs' })

ctx.t('Submit', { ns: 'myModule' });

ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Examples

### Simple key

```ts
ctx.t('Submit');
ctx.t('No data');
```

### With interpolation

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Relative time etc.

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Specify namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Notes

- **Localization plugin**: Activate the localization plugin to manage translations. Missing keys can be collected for translation.
- i18next-style interpolation: use `{{varName}}` in the key and pass the same name in `options`.
- Language comes from the current context (e.g. `ctx.i18n.language`, user locale).

## Related

- [ctx.i18n](./i18n.md): read or change language
