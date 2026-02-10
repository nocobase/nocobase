# ctx.t()

i18n helper for translating strings in RunJS, based on the current context language. Suitable for inline text such as buttons, titles, and hints.

## Type definition

```typescript
t(key: string, options?: Record<string, any>): string
```

## Parameters

| Parameter | Type | Description |
|------|------|------|
| `key` | string | Translation key or template with placeholders (e.g. `Hello {{name}}`, `{{count}} rows`) |
| `options` | object | Optional. Interpolation variables (e.g. `{ name: 'Alice', count: 5 }`) or i18n options (`defaultValue`, `ns`) |

## Return value

- Returns translated string. If no translation exists and no `defaultValue` is provided, it may return the key itself or the interpolated string.

## Notes

- i18next-style interpolation is supported: use `{{var}}` in the key and pass variables in `options`.
- Language is determined by current context (user language, app locale).
- When the localization plugin is enabled, `ctx.t` strings are extracted for centralized translation management.

## Examples

### Simple keys

```javascript
ctx.t('Submit');
ctx.t('No data');
```

### With interpolation

```javascript
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```js
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dynamic time text

```javascript
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Namespaces (ns)

When translation resources are split by namespace, use `ns` to specify which namespace to search:

```javascript
// Read from a specific namespace
ctx.t('Submit', { ns: 'myModule' });

// Search multiple namespaces in order (myModule, then common)
ctx.t('Save', { ns: ['myModule', 'common'] });

// Interpolation with namespace
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```
