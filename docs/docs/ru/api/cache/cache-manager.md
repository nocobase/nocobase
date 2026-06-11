# CacheManager - Менеджер кэша

## Обзор

CacheManager основан на <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> и предоставляет управление модулем кэша для NocoBase. Встроенные типы кэша:

- memory - lru-cache, предоставляемый по умолчанию в node-cache-manager
- redis - поддерживается через node-cache-manager-redis-yet

Дополнительные типы можно регистрировать и расширять через API.

### Концепции

- **Store**: Определяет способ кэширования, включая фабричный метод создания кэша и связанные конфигурации. Каждый способ кэширования имеет уникальный идентификатор, задаваемый при регистрации.
  Уникальные идентификаторы двух встроенных способов кэширования: `memory` и `redis`.

- **Store Factory Method**: Метод, предоставляемый `node-cache-manager` и связанными пакетами расширений для создания кэша. Например, `'memory'`, предоставляемый по умолчанию в `node-cache-manager`, и `redisStore`, предоставляемый `node-cache-manager-redis-yet`. Это соответствует первому параметру метода `caching` в `node-cache-manager`.

- **Cache**: Класс, инкапсулированный NocoBase, который предоставляет методы для работы с кэшем. При фактическом использовании кэша вы работаете с экземпляром `Cache`. Каждый экземпляр `Cache` имеет уникальный идентификатор, который может использоваться как пространство имен для разделения разных модулей.

## Методы класса

### `constructor()`

#### Сигнатура

- `constructor(options?: CacheManagerOptions)`

#### Типы

```ts
export type CacheManagerOptions = Partial<{
  defaultStore: string;
  stores: {
    [storeType: string]: StoreOptions;
  };
}>;

type StoreOptions = {
  store?: 'memory' | FactoryStore<Store, any>;
  close?: (store: Store) => Promise<void>;
  // глобальная конфигурация
  [key: string]: any;
};
```

#### Подробности

##### CacheManagerOptions

| Свойство | Тип                    | Описание                                                                                                                                                                                                            |
| ------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore`      | `string`                       | Уникальный идентификатор типа кэша по умолчанию.                                                                                                                                                                                 |
| `stores`            | `Record<string, StoreOptions>` | Регистрирует типы кэша. Ключ — это уникальный идентификатор типа кэша, значение — объект с методом регистрации и глобальной конфигурацией типа кэша.<br />В `node-cache-manager` метод создания кэша: `await caching(store, config)`. Объект здесь — это [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Свойство | Тип                            | Описание                                                                                                                                                                        |
| ------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`             | `memory` \| `FactoryStore<Store, any>` | Фабричный метод store, соответствует первому параметру `caching`.                                                                                                                            |
| `close`             | `(store: Store) => Promise<void>`      | Необязательно. Для middleware (например, Redis), требующего соединения, нужно передать callback для закрытия соединения. Входной параметр — объект, возвращаемый фабричным методом store. |
| `[key: string]`     | `any`                                  | Другие глобальные конфигурации store, соответствуют второму параметру `caching`.                                                                                                             |

#### `options` по умолчанию

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // глобальная конфигурация
      max: 2000,
    },
    redis: {
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
    },
  },
};
```

Параметр `options` будет объединен с параметрами по умолчанию. Свойства, которые уже есть в дефолтной конфигурации, можно не указывать. Например:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore уже предоставлен в параметрах по умолчанию, поэтому достаточно указать только конфигурацию redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Регистрирует новый способ кэширования. Например:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // уникальный идентификатор store
  name: 'redis',
  // фабричный метод для создания store
  store: redisStore,
  // закрытие соединения store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // глобальная конфигурация
  url: 'xxx',
});
```

#### Сигнатура

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Создает кэш. Например:

```ts
await cacheManager.createCache({
  name: 'default', // уникальный идентификатор кеша
  store: 'memory', // уникальный идентификатор store
  prefix: 'mycache', // автоматически добавляет префикс 'mycache:' к ключам кеша, необязательно
  // другие конфигурации store, пользовательские настройки будут объединены с глобальной конфигурацией store
  max: 2000,
});
```

#### Сигнатура

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Подробности

##### options

| Свойство | Тип  | Описание                                  |
| ------------------- | ---------- | -------------------------------------------------------- |
| `name`              | `string`   | Уникальный идентификатор кэша.                           |
| `store`             | `string`   | Уникальный идентификатор store.                          |
| `prefix`            | `string`   | Необязательно, префикс ключей кэша.                      |
| `[key: string]`     | `any`      | Другие пользовательские параметры, связанные со store.   |

Если `store` не указан, будет использован `defaultStore`. В таком случае способ кэширования будет зависеть от системного способа кэширования по умолчанию.

Если пользовательские параметры отсутствуют, возвращается пространство кэша по умолчанию, созданное глобальной конфигурацией и совместно используемое текущим способом кэширования. Рекомендуется добавлять `prefix`, чтобы избежать конфликтов ключей.

```ts
// Использовать кэш по умолчанию с глобальной конфигурацией
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

См. [Cache](./cache.md)

### `getCache()`

Получает соответствующий кэш.

```ts
cacheManager.getCache('default');
```

#### Сигнатура

- `getCache(name: string): Cache`

### `flushAll()`

Сбрасывает все кэши.

```ts
await cacheManager.flushAll();
```

### `close()`

Закрывает все соединения промежуточного ПО кэша.

```ts
await cacheManager.close();
```