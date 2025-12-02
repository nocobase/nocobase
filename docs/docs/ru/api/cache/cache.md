:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Кэш

## Основные методы

Ознакомьтесь с документацией <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

Этот метод аналогичен `wrap()`, но позволяет вам условно решать, использовать ли кэш.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Внешний параметр для управления использованием кэшированного результата
    useCache?: boolean;
    // Принимает решение о кэшировании на основе полученных данных
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Когда кэшированное содержимое является объектом, этот метод изменяет значение определённого ключа.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Когда кэшированное содержимое является объектом, этот метод получает значение определённого ключа.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Когда кэшированное содержимое является объектом, этот метод удаляет определённый ключ.

```ts
async delValueInObject(key: string, objectKey: string)
```