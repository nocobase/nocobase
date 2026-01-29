# ctx.api.storage

A local storage wrapper based on browser `localStorage`. It automatically adds a prefix (`storagePrefix`) to avoid key collisions with other apps or instances.

## Notes

- `ctx.api.storage` lets you store simple key-value data locally
- All keys are automatically prefixed (e.g., `NOCOBASE_`), no manual handling needed
- Suitable for lightweight data like current space ID, recent items, toggle states, etc.

## Common Methods

```ts
api.storage.getItem(key: string): string | null;
api.storage.setItem(key: string, value: string): void;
api.storage.removeItem(key: string): void;
```

> Note:
> - All values are strings. To store objects, use `JSON.stringify` / `JSON.parse`.
> - Not suitable for sensitive information (e.g., plaintext passwords). Store sensitive data on the server or in a safer storage mechanism.
