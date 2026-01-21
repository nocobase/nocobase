:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Кеш

## Основні методи

Ви можете звернутися до документації <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>.

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

## Інші методи

### `wrapWithCondition()`

Працює аналогічно `wrap()`, але дає змогу умовно вирішувати, чи слід використовувати кеш.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // Зовнішній параметр для контролю використання кешованого результату
    useCache?: boolean;
    // Вирішує, чи кешувати, на основі результату даних
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

Коли кешований вміст є об'єктом, змінює значення певного ключа.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

Коли кешований вміст є об'єктом, отримує значення певного ключа.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

Коли кешований вміст є об'єктом, видаляє певний ключ.

```ts
async delValueInObject(key: string, objectKey: string)
```