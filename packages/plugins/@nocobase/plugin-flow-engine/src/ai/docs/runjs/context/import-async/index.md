# ctx.importAsync()

Dynamically load **ESM modules** or **CSS** by URL. Use for JS block, JS field, JS action, etc. Use `ctx.importAsync()` for ESM libraries; use `ctx.requireAsync()` for UMD/AMD. Passing a `.css` URL loads and injects the stylesheet.

## Type Definition

```typescript
importAsync<T = any>(url: string): Promise<T>;
```

## Parameters

- **url** (string): ESM module or CSS URL.
  - **Shorthand**: `<package>@<version>` (e.g. `vue@3.4.0`), prefixed by configured CDN (default `https://esm.sh`).
  - **Subpath**: `<package>@<version>/<path>` (e.g. `dayjs@1/plugin/relativeTime.js`).
  - **Full URL**: Any absolute URL (e.g. `https://cdn.example.com/my-module.js`).
  - **CSS**: Pass a `.css` URL; the stylesheet is loaded and injected into the page.

## Returns

- For **ESM**: Resolved module namespace object (the value the Promise resolves to).
- For **CSS**: Promise resolves after the stylesheet is injected (no meaningful return value; use `await` to wait for load).

## Notes

- **ESM and CSS**: Besides ESM modules, also supports loading CSS (pass a `.css` URL; it is injected into the page).
- **Shorthand**: By default **https://esm.sh** is used as CDN prefix. E.g. `vue@3.4.0` requests `https://esm.sh/vue@3.4.0`.
- **Custom CDN**: Set env vars for self-hosted or intranet CDN:
  - **ESM_CDN_BASE_URL**: ESM CDN base URL (default `https://esm.sh`).
  - **ESM_CDN_SUFFIX**: Optional suffix (e.g. jsDelivr `/+esm`).
  - Self-hosted server: [nocobase/esm-server](https://github.com/nocobase/esm-server).
- **vs ctx.requireAsync()**: `ctx.importAsync()` loads **ESM** (or CSS) and returns the module namespace for ESM (Vue, dayjs, etc.). `ctx.requireAsync()` loads **UMD/AMD** or global scripts (ECharts, FullCalendar). Prefer `ctx.importAsync()` when the library offers ESM.
