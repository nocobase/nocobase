:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Pamięć podręczna

## Podstawowe metody

Proszę zapoznać się z <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">dokumentacją node-cache-manager</a>.

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

## Inne metody

### `wrapWithCondition()`

Funkcja podobna do `wrap()`, ale pozwala warunkowo zdecydować, czy użyć pamięci podręcznej.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Parametr zewnętrzny kontrolujący, czy użyć wyniku z pamięci podręcznej
    useCache?: boolean;
    // Decyduje, czy zapisać w pamięci podręcznej na podstawie wyniku danych
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Gdy zawartość pamięci podręcznej jest obiektem, zmienia wartość określonego klucza.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Gdy zawartość pamięci podręcznej jest obiektem, pobiera wartość określonego klucza.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Gdy zawartość pamięci podręcznej jest obiektem, usuwa określony klucz.

```ts
async delValueInObject(key: string, objectKey: string)
```