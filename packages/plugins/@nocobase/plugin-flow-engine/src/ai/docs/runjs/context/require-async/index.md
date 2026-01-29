# ctx.requireAsync()

Load external libraries asynchronously by URL (UMD/AMD/global format). Suitable for third-party libraries that need to be attached to the global object in JSBlock / JSField / JSAction.

## Type Definition (Simplified)

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- `url`: CDN URL of the library (UMD/AMD format)
- Returns: the loaded library object (depends on export style)

> Notes:
> - `ctx.requireAsync` is suitable for UMD/AMD/global libraries (e.g., FullCalendar, jQuery plugins)
> - After loading, the library is usually attached to the global object (e.g., `window.FullCalendar`)
> - If the library provides an ESM version, prefer `ctx.importAsync` for modern module semantics

## Difference from ctx.importAsync()

- [ctx.importAsync() vs ctx.requireAsync()](../import-async/import-async-vs-require-async.md)
