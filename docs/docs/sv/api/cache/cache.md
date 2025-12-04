:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Cache

## Grundläggande metoder

Se dokumentationen för <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Andra metoder

### `wrapWithCondition()`

Fungerar liknande `wrap()`, men låter dig villkorligt bestämma om ni ska använda cachen.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Extern parameter för att styra om det cachade resultatet ska användas
    useCache?: boolean;
    // Bestäm om ni ska cacha baserat på dataresultatet
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

När cacheinnehållet är ett objekt, ändra värdet för en specifik nyckel.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

När cacheinnehållet är ett objekt, hämta värdet för en specifik nyckel.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

När cacheinnehållet är ett objekt, ta bort en specifik nyckel.

```ts
async delValueInObject(key: string, objectKey: string)
```