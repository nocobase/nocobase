---
title: "ctx.importAsync() vs ctx.requireAsync()"
description: "Compare two dynamic loading methods to choose the right one."
---

# ctx.importAsync() vs ctx.requireAsync()

## Key Differences

| Feature | `ctx.importAsync()` | `ctx.requireAsync()` |
|------|---------------------|----------------------|
| **Module format** | ESM (ES Module) | UMD/AMD/global libraries |
| **Underlying implementation** | Native `dynamic import()` | RequireJS |
| **Return value** | Module namespace object (includes `default` and named exports) | Library object (depends on export style) |
| **Global pollution** | No global pollution | Mounted on `window`, may pollute globals |
| **Modernity** | ✅ Modern standard, recommended | ⚠️ Legacy approach, for older libs |
| **Use cases** | Modern ESM libs (e.g., @fullcalendar/core, tabulator-tables) | Legacy UMD libs (e.g., jQuery plugins, FullCalendar 5.x) |

## Recommendations

### Use `ctx.importAsync()`

- ✅ The library provides ESM format (CDNs often support `+esm`)
- ✅ You want tree-shaking
- ✅ You want to avoid global namespace pollution
- ✅ You use modern libraries (e.g., FullCalendar 6, Tabulator 6+)

**Example:**
```ts
// Load an ESM module
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');
```

### Use `ctx.requireAsync()`

- ✅ The library only provides UMD/AMD format
- ✅ The library needs to attach to the global object (e.g., `window.jQuery`, `window.FullCalendar`)
- ✅ You use legacy libraries (e.g., jQuery plugins, FullCalendar 5.x)

**Example:**
```ts
// Load a UMD library (mounted on window.FullCalendar)
await ctx.requireAsync('fullcalendar@5.11.5/index.global.min.js');
const calendar = new FullCalendar.Calendar(calendarEl, { ... });
```

## Technical Details

### `ctx.importAsync()` implementation

- Uses native `dynamic import()` API
- Has caching; the same URL loads only once
- Returns a standard ESM module object

### `ctx.requireAsync()` implementation

- Based on the RequireJS loader
- Suitable for AMD/UMD modules
- The library may attach directly to `window`
- Requires a RequireJS runtime

## Migration Suggestions

If a library provides both ESM and UMD versions, **prefer `ctx.importAsync()`**:

```ts
// ❌ Old way (UMD)
await ctx.requireAsync('/library@1.0.0/dist/library.min.js');
const Lib = window.Library;

// ✅ New way (ESM)
const Lib = await ctx.importAsync('library@1.0.0');
```

> Tip:
> - RunJS scripts support `await` directly; it's recommended to load dependencies at the top via `ctx.importAsync()` or `ctx.requireAsync()`
> - Most modern CDNs (e.g., jsDelivr) support adding `+esm` to URLs to convert libraries to ESM automatically
> - If a library only provides UMD, you must use `ctx.requireAsync()`
> - If unsure, try `ctx.importAsync()` first and fall back to `ctx.requireAsync()`
