# ctx.importAsync()

Dynamically import ESM modules by URL (works in both dev and prod). Suitable for loading third-party libraries in JSBlock / JSField / JSAction without bundling.

## Type Definition (Simplified)

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- `url`: ESM module address. Default format is `<module-name>@<version>` (e.g., `vue@3.4.0`), which will be prefixed by `ESM_CDN_BASE_URL` (default `https://esm.sh`). Full URLs are also supported (e.g., `https://esm.sh/vue@3.4.0`).
- Returns: the resolved module namespace object

## Difference from ctx.requireAsync()

- [ctx.importAsync() vs ctx.requireAsync()](./import-async-vs-require-async.md)
