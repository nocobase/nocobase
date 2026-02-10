# ctx.importAsync()

Dynamically load **ESM modules** or **CSS** by URL, for JS blocks/fields/actions. Use `ctx.importAsync()` for ESM libraries; use `ctx.requireAsync()` for UMD/AMD libraries. Passing a `.css` URL will load and inject styles.

## Type definition

```typescript
importAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Description |
|------|------|------|
| `url` | string | ESM module or CSS URL. Supports shorthand `<package>@<version>` or with subpath `<package>@<version>/<file>` (e.g. `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), resolved using the CDN base; full URLs are also supported. `.css` URLs load and inject styles. |

## Return value

- The resolved module namespace object (Promise value).

## Notes

- **ESM and CSS**: besides ESM modules, CSS is also supported (pass a `.css` URL).
- **Shorthand**: when not configured, **https://esm.sh** is used as the CDN base. For example `vue@3.4.0` resolves to `https://esm.sh/vue@3.4.0`.
- **Self-hosted CDN**: configure an internal CDN via environment variables:
  - **ESM_CDN_BASE_URL**: ESM CDN base URL (default `https://esm.sh`)
  - **ESM_CDN_SUFFIX**: optional suffix (e.g. `/+esm` for jsDelivr)
  - See: [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Example

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalent to loading from https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// With subpath (e.g. dayjs plugin)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// Full URL

await ctx.importAsync('https://cdn.example.com/theme.css');
// Load CSS and inject into the page
```

## Difference from ctx.requireAsync()

- **ctx.importAsync()**: loads **ESM modules**, returns module namespace, suitable for modern libraries (Vue, dayjs, etc.).
- **ctx.requireAsync()**: loads **UMD/AMD** or global scripts, commonly used for ECharts, FullCalendar, etc. If an ESM build exists, prefer `ctx.importAsync()`.
