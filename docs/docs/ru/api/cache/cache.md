# Cache - Кэш

## Базовые методы

Обратитесь к документации <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Другие методы

### `wrapWithCondition()`

Похож на `wrap()`, но позволяет по условию решать, использовать ли кэш.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Внешний параметр для управления использованием кэшированного результата
    useCache?: boolean;
    // Решение о кэшировании на основе результата данных 
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Когда содержимое кэша является объектом, изменяет значение указанного ключа.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Когда содержимое кэша является объектом, получает значение указанного ключа.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Когда содержимое кэша является объектом, удаляет указанный ключ.

```ts
async delValueInObject(key: string, objectKey: string)
```