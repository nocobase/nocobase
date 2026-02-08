# ctx.requireAsync()

Load **UMD/AMD** or global scripts by URL, or load **CSS**. Use for JS block, JS field, JS action, etc. Use `ctx.requireAsync()` for UMD/AMD libraries; use `ctx.importAsync()` for ESM. Passing a `.css` URL loads and injects the stylesheet.

## Type Definition

```typescript
requireAsync<T = any>(url: string): Promise<T>;
```

## Parameters

- **url** (string): UMD/AMD script or CSS URL.
  - **Shorthand**: `<package>@<version>/<path>` (e.g. `echarts@5/dist/echarts.min.js`). Resolved via the same ESM CDN config as `ctx.importAsync()`; request URL gets `?raw` to fetch the raw UMD file (default esm.sh: `https://esm.sh/echarts@5/dist/echarts.min.js?raw`).
  - **Full URL**: Any absolute URL (e.g. `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`).
  - **CSS**: Pass a `.css` URL; the stylesheet is loaded and injected into the page.

## Returns

- For **UMD/AMD**: Loaded library object (depends on the library’s export style). Many UMD libraries attach to the global (e.g. `window.xxx`); use the library’s docs.
- For **CSS**: Promise resolves after the stylesheet is injected (no meaningful return value; use `await` to wait for load).

## Notes

- **UMD/AMD and CSS**: Besides UMD/AMD scripts, also supports loading CSS (pass a `.css` URL; it is injected into the page).
- **Shorthand**: Same CDN config as `ctx.importAsync()` (e.g. **ESM_CDN_BASE_URL**). E.g. `echarts@5/dist/echarts.min.js` with default esm.sh requests `https://esm.sh/echarts@5/dist/echarts.min.js?raw`.
- **Full URL**: You can use any CDN’s full URL directly.
- **vs ctx.importAsync()**: `ctx.requireAsync()` loads **UMD/AMD/global** scripts (ECharts, FullCalendar, jQuery plugins) or CSS. `ctx.importAsync()` loads **ESM** or CSS and returns the module namespace for ESM. Prefer `ctx.importAsync()` when the library offers ESM.
