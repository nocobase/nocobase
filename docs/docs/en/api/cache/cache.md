# Cache

## Basic Methods

Refer to the <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> documentation.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## Other Methods

### `wrapWithCondition()`

Similar to `wrap()`, but allows you to conditionally decide whether to use the cache.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // External parameter to control whether to use the cached result
    useCache?: boolean;
    // Decide whether to cache based on the data result
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

When the cached content is an object, change the value of a specific key.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

When the cached content is an object, get the value of a specific key.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

When the cached content is an object, delete a specific key.

```ts
async delValueInObject(key: string, objectKey: string)
```