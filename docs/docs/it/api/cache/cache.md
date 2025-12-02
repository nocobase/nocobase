:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Cache

## Metodi Base

Può fare riferimento alla documentazione di <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Altri Metodi

### `wrapWithCondition()`

Simile a `wrap()`, ma Le permette di decidere in modo condizionale se utilizzare o meno la cache.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Parametro esterno per controllare se utilizzare il risultato della cache
    useCache?: boolean;
    // Decide se memorizzare nella cache in base al risultato dei dati
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Quando il contenuto della cache è un oggetto, cambia il valore di una chiave specifica.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Quando il contenuto della cache è un oggetto, recupera il valore di una chiave specifica.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Quando il contenuto della cache è un oggetto, elimina una chiave specifica.

```ts
async delValueInObject(key: string, objectKey: string)
```