:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Mezipaměť

## Základní metody

Podívejte se na dokumentaci <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Další metody

### `wrapWithCondition()`

Podobné jako `wrap()`, ale umožňuje Vám podmíněně rozhodnout, zda použít mezipaměť.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Externí parametr pro řízení, zda použít výsledek z mezipaměti
    useCache?: boolean;
    // Rozhodněte, zda uložit do mezipaměti na základě výsledku dat
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Pokud je obsah mezipaměti objekt, změňte hodnotu konkrétního klíče.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Pokud je obsah mezipaměti objekt, získejte hodnotu konkrétního klíče.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Pokud je obsah mezipaměti objekt, odstraňte konkrétní klíč.

```ts
async delValueInObject(key: string, objectKey: string)
```