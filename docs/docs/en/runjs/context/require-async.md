# ctx.requireAsync()

Load **UMD/AMD** or global scripts by URL, and also supports **CSS**. Suitable for JS blocks/fields/actions. Use `ctx.requireAsync()` for UMD/AMD libraries, and `ctx.importAsync()` for ESM libraries. Passing a `.css` URL will load and inject styles.

## Type definition

```typescript
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameters

| Parameter | Type | Description |
|------|------|------|
| `url` | string | Supports two forms: **shorthand path** `<package>@<version>/<file>` (same as `ctx.importAsync()`, resolved via ESM CDN and requested with `?raw` for the UMD file), or a **full URL** (e.g. `https://cdn.jsdelivr.net/npm/xxx`). `.css` URLs are also supported and will be injected. |

## Return value

- The loaded library object (format depends on the library). Many UMD libraries attach to globals (e.g. `window.xxx`).

## Notes

- **UMD/AMD and CSS**: besides UMD/AMD scripts, CSS loading is supported.
- **Shorthand**: for example `echarts@5/dist/echarts.min.js` becomes `https://esm.sh/echarts@5/dist/echarts.min.js?raw` by default.
- **Full URL**: any CDN URL can be used directly.

## Example

```javascript
// Shorthand path (resolved via esm.sh with ?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Full URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// Load CSS and inject
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

## Difference from ctx.importAsync()

- **ctx.requireAsync()**: loads **UMD/AMD/global** scripts, suitable for ECharts, FullCalendar, jQuery plugins, etc. Libraries often attach to `window`.
- **ctx.importAsync()**: loads **ESM modules** and returns module namespace. If an ESM build exists, prefer `ctx.importAsync()` for better module semantics and tree-shaking.
