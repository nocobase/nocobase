# Importing Modules

In RunJS, you can use two types of modules: **Built-in modules** (accessed directly via `ctx.libs` without importing) and **External modules** (loaded on demand via `ctx.importAsync()` or `ctx.requireAsync()`).

---

## Built-in Modules - ctx.libs (No import required)

RunJS includes several built-in libraries that can be accessed directly through `ctx.libs`. You **do not** need to use `import` or asynchronous loading for these.

| Property | Description |
|------|------|
| **ctx.libs.React** | React core, used for JSX and Hooks |
| **ctx.libs.ReactDOM** | ReactDOM (can be used for `createRoot`, etc.) |
| **ctx.libs.antd** | Ant Design component library |
| **ctx.libs.antdIcons** | Ant Design icons |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): Mathematical expressions, matrix operations, etc. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel-like formulas (SUM, AVERAGE, etc.) |

### Example: React and antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click Me</Button>);
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

When you need third-party libraries, choose the loading method based on the module format:

- **ESM Modules** → Use `ctx.importAsync()`
- **UMD/AMD Modules** → Use `ctx.requireAsync()`

---

### Importing ESM Modules

Use **`ctx.importAsync()`** to dynamically load ESM modules by URL. This is suitable for scenarios like JS blocks, JS fields, and JS actions.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: The ESM module address. Supports shorthand formats like `<package>@<version>` or subpaths like `<package>@<version>/<file-path>` (e.g., `vue@3.4.0`, `lodash@4/lodash.js`). These will be prefixed with the configured CDN base URL. Full URLs are also supported.
- **Returns**: The resolved module namespace object.

#### Default: https://esm.sh

If not configured otherwise, shorthand forms will use **https://esm.sh** as the CDN prefix. For example:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// Equivalent to loading from https://esm.sh/vue@3.4.0
```

#### Self-hosted esm.sh Service

If you need to use an internal network or a self-built CDN, you can deploy a service compatible with the esm.sh protocol and specify it via environment variables:

- **ESM_CDN_BASE_URL**: The base URL for the ESM CDN (defaults to `https://esm.sh`)
- **ESM_CDN_SUFFIX**: Optional suffix (e.g., `/+esm` for jsDelivr)

For self-hosting, refer to: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Importing UMD/AMD Modules

Use **`ctx.requireAsync()`** to asynchronously load UMD/AMD modules or scripts that attach to the global object.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: Supports two forms:
  - **Shorthand path**: `<package>@<version>/<file-path>`, similar to `ctx.importAsync()`, resolved according to the current ESM CDN configuration. When resolving, `?raw` is appended to request the raw file directly (usually a UMD build). For example, `echarts@5/dist/echarts.min.js` actually requests `https://esm.sh/echarts@5/dist/echarts.min.js?raw` (when using the default esm.sh).
  - **Full URL**: Any full CDN address (e.g., `https://cdn.jsdelivr.net/npm/xxx`).
- **Returns**: The loaded library object (the specific form depends on how the library exports its content).

After loading, many UMD libraries attach themselves to the global object (e.g., `window.xxx`). You can use them as described in the library's documentation.

**Example**

```ts
// Shorthand path (resolved via esm.sh as ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Full URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Note**: If a library provides an ESM version, prefer using `ctx.importAsync()` for better module semantics and Tree-shaking.