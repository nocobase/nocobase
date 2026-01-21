:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Cache

## Basismethoden

Raadpleeg de documentatie van <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Overige methoden

### `wrapWithCondition()`

Vergelijkbaar met `wrap()`, maar u kunt hiermee voorwaardelijk bepalen of u de cache wilt gebruiken.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Externe parameter om te bepalen of het gecachete resultaat gebruikt moet worden
    useCache?: boolean;
    // Bepaal of er gecachet moet worden op basis van het dataresultaat
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Wanneer de gecachete inhoud een object is, wijzigt u de waarde van een specifieke key.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Wanneer de gecachete inhoud een object is, haalt u de waarde van een specifieke key op.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Wanneer de gecachete inhoud een object is, verwijdert u een specifieke key.

```ts
async delValueInObject(key: string, objectKey: string)
```