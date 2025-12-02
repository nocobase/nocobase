:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# CacheManager

## Огляд

CacheManager базується на <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> та надає NocoBase функціонал для керування модулями кешу. Вбудовані типи кешу:

- memory - lru-кеш, що надається за замовчуванням node-cache-manager
- redis - підтримується node-cache-manager-redis-yet

Більше типів можна зареєструвати та розширити через API.

### Концепції

- **Store**: Визначає метод кешування, що включає фабричний метод для створення кешів та інші пов'язані конфігурації. Кожен метод кешування має унікальний ідентифікатор, який надається під час реєстрації.
  Унікальні ідентифікатори для двох вбудованих методів кешування – це `memory` та `redis`.

- **Фабричний метод Store**: Метод, що надається `node-cache-manager` та пов'язаними пакетами розширень для створення кешів. Наприклад, `'memory'`, що надається за замовчуванням `node-cache-manager`, або `redisStore`, що надається `node-cache-manager-redis-yet`. Це відповідає першому параметру методу `caching` у `node-cache-manager`.

- **Cache**: Клас, інкапсульований NocoBase, який надає методи для використання кешу. При фактичному використанні кешу ви працюєте з екземпляром `Cache`. Кожен екземпляр `Cache` має унікальний ідентифікатор, який можна використовувати як простір імен для розрізнення різних модулів.

## Методи класу

### `constructor()`

#### Сигнатура

- `constructor(options?: CacheManagerOptions)`

#### Типи

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
  // global config
  [key: string]: any;
};
```

#### Деталі

##### CacheManagerOptions

| Властивість    | Тип                            | Опис                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Унікальний ідентифікатор для типу кешу за замовчуванням.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Реєструє типи кешу. Ключ — це унікальний ідентифікатор для типу кешу, а значення — об'єкт, що містить метод реєстрації та глобальну конфігурацію для типу кешу.<br />У `node-cache-manager` метод для створення кешу — це `await caching(store, config)`. Об'єкт, який потрібно надати тут, — це [`StoreOptions`](#storeoptions). |

##### StoreOptions

| Властивість     | Тип                                    | Опис                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | Фабричний метод store, що відповідає першому параметру `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | Необов'язково. Для проміжного програмного забезпечення, такого як Redis, що вимагає з'єднання, необхідно надати метод зворотного виклику для закриття з'єднання. Вхідним параметром є об'єкт, що повертається фабричним методом store. |
| `[key: string]` | `any`                                  | Інші глобальні конфігурації store, що відповідають другому параметру `caching`.                                                                                                               |

#### `options` за замовчуванням

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // глобальна конфігурація
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

Параметр `options` буде об'єднано з параметрами за замовчуванням. Властивості, які вже присутні в параметрах за замовчуванням, можна опустити. Наприклад:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore вже надано в параметрах за замовчуванням, тому вам потрібно лише надати конфігурацію redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

Реєструє новий метод кешування. Наприклад:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // унікальний ідентифікатор store
  name: 'redis',
  // фабричний метод для створення store
  store: redisStore,
  // закрити з'єднання store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // глобальна конфігурація
  url: 'xxx',
});
```

#### Сигнатура

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Створює кеш. Наприклад:

```ts
await cacheManager.createCache({
  name: 'default', // унікальний ідентифікатор кешу
  store: 'memory', // унікальний ідентифікатор store
  prefix: 'mycache', // автоматично додає префікс 'mycache:' до ключів кешу, необов'язково
  // інші конфігурації store, користувацькі конфігурації будуть об'єднані з глобальною конфігурацією store
  max: 2000,
});
```

#### Сигнатура

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Деталі

##### options

| Властивість     | Тип      | Опис                                           |
| --------------- | -------- | ---------------------------------------------- |
| `name`          | `string` | Унікальний ідентифікатор кешу.                      |
| `store`         | `string` | Унікальний ідентифікатор store.                      |
| `prefix`        | `string` | Необов'язково, префікс ключа кешу.                           |
| `[key: string]` | `any`    | Інші користувацькі параметри конфігурації, пов'язані зі store. |

Якщо `store` опущено, буде використано `defaultStore`. У цьому випадку метод кешування змінюватиметься відповідно до системного методу кешування за замовчуванням.

Якщо немає користувацьких конфігурацій, повертається простір кешу за замовчуванням, створений глобальною конфігурацією та спільний для поточного методу кешування. Рекомендується додати `prefix`, щоб уникнути конфліктів ключів.

```ts
// Використовувати кеш за замовчуванням з глобальною конфігурацією
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

Дивіться [Cache](./cache.md)

### `getCache()`

Отримує відповідний кеш.

```ts
cacheManager.getCache('default');
```

#### Сигнатура

- `getCache(name: string): Cache`

### `flushAll()`

Скидає всі кеші.

```ts
await cacheManager.flushAll();
```

### `close()`

Закриває всі з'єднання проміжного програмного забезпечення кешу.

```ts
await cacheManager.close();
```