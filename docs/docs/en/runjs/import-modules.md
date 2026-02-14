# Import Modules

In RunJS you can use two kinds of modules: **built-in modules** (via `ctx.libs`, no import needed) and **external modules** (loaded on demand via `ctx.importAsync()` or `ctx.requireAsync()`).

---

## Built-in Modules - ctx.libs (no import)

RunJS provides common libraries via `ctx.libs`; you can use them directly **without** `import` or async loading.

| Property | Description |
|----------|-------------|
| **ctx.libs.React** | React core for JSX and Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (e.g. for createRoot) |
| **ctx.libs.antd** | Ant Design components |
| **ctx.libs.antdIcons** | Ant Design icons |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): math expressions, matrix operations, etc. |
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

## External Modules

For third-party libraries, choose the loader by module format:

- **ESM** → use `ctx.importAsync()`
- **UMD/AMD** → use `ctx.requireAsync()`

---

### Import ESM Modules

Use **`ctx.importAsync()`** to load ESM modules by URL at runtime. Suitable for JS Block, JS Field, JS Action, etc.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: ESM module URL. Supports shorthand `<package>@<version>` or subpath `<package>@<version>/<path>` (e.g. `vue@3.4.0`, `lodash@4/lodash.js`), which is resolved with the configured CDN prefix; full URLs are also supported.
- **Returns**: The resolved module namespace object.

#### Default: https://esm.sh

When not configured, the shorthand form uses **https://esm.sh** as the CDN prefix. For example:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// equivalent to loading from https://esm.sh/vue@3.4.0
```

#### Self-hosted esm.sh

For intranet or custom CDN, deploy an esm.sh-compatible service and set:

- **ESM_CDN_BASE_URL**: ESM CDN base URL (default `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Optional suffix (e.g. jsDelivr’s `/+esm`)

Reference: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Import UMD/AMD Modules

Use **`ctx.requireAsync()`** to load UMD/AMD scripts or scripts that attach to the global object by URL.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Either:
  - **Shorthand path**: `<package>@<version>/<path>`, same as `ctx.importAsync()`; resolved with the current ESM CDN config; `?raw` is appended to request the raw file (usually UMD). E.g. `echarts@5/dist/echarts.min.js` becomes `https://esm.sh/echarts@5/dist/echarts.min.js?raw` when using default esm.sh.
  - **Full URL**: Any CDN URL (e.g. `https://cdn.jsdelivr.net/npm/xxx`).
- **Returns**: The loaded library object (shape depends on the library’s exports).

Many UMD libraries attach to the global (e.g. `window.xxx`); use them as documented.

**Example**

```ts
// Shorthand (resolved via esm.sh with ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Full URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Note**: If a library provides both ESM and UMD, prefer `ctx.importAsync()` for better module semantics and tree-shaking.
