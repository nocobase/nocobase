# Import Modules

RunJS supports two categories of modules: **built-in modules** (available via `ctx.libs` without import) and **external modules** (loaded on demand via `ctx.importAsync()` or `ctx.requireAsync()`).

---

## Built-in modules - ctx.libs (no import required)

RunJS ships with common libraries that are directly available via `ctx.libs`.

| Property | Description |
|------|------|
| **ctx.libs.React** | React core, for JSX and Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (useful for `createRoot`, etc.) |
| **ctx.libs.antd** | Ant Design component library |
| **ctx.libs.antdIcons** | Ant Design icons |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): math expressions, matrix ops |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel-like formulas (SUM, AVERAGE, etc.) |

### Example: React and antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Example: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### Example: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## External modules

Pick the loading method based on the module format:

- **ESM modules** -> `ctx.importAsync()`
- **UMD/AMD modules** -> `ctx.requireAsync()`

---

### Import ESM modules

Use **`ctx.importAsync()`** to dynamically load ESM modules by URL, suitable for JS blocks/fields/actions.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: ESM module URL. Supports shorthand `<package>@<version>` or with subpath `<package>@<version>/<file>` (e.g. `vue@3.4.0`, `lodash@4/lodash.js`), which will be resolved with the configured CDN base; full URLs are also supported.
- **Return**: resolved module namespace object.

#### Default CDN: https://esm.sh

If not configured, shorthand URLs are resolved via **https://esm.sh**. For example:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalent to loading from https://esm.sh/vue@3.4.0
```

#### Self-hosted esm.sh-compatible service

You can deploy an internal CDN compatible with esm.sh and configure it via environment variables:

- **ESM_CDN_BASE_URL**: ESM CDN base URL (default `https://esm.sh`)
- **ESM_CDN_SUFFIX**: optional suffix (e.g. `/+esm` for jsDelivr)

See: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Import UMD/AMD modules

Use **`ctx.requireAsync()`** to load UMD/AMD scripts or scripts that attach to globals.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: supports two forms:
  - **Shorthand path**: `<package>@<version>/<file>` (same as `ctx.importAsync()`), resolved by the ESM CDN; `?raw` is appended to request the raw UMD file. For example, `echarts@5/dist/echarts.min.js` becomes `https://esm.sh/echarts@5/dist/echarts.min.js?raw` when using esm.sh.
  - **Full URL**: any CDN URL (e.g. `https://cdn.jsdelivr.net/npm/xxx`).
- **Return**: loaded library object (format depends on the library).

Many UMD libraries attach to globals (e.g. `window.xxx`). Use them as described in the library docs.

**Example**

```ts
// Shorthand path (resolved via esm.sh with ?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Full URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Note**: If a library provides an ESM build, prefer `ctx.importAsync()` for better module semantics and tree-shaking.
