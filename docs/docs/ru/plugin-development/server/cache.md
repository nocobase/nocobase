:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Кэш

Модуль кэширования NocoBase основан на библиотеке <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> и предоставляет функциональность кэширования для разработки плагинов. Система имеет два встроенных типа кэша:

- **memory** - Кэш в оперативной памяти на основе lru-cache, предоставляемый `node-cache-manager` по умолчанию.
- **redis** - Кэш Redis на основе `node-cache-manager-redis-yet`.

Дополнительные типы кэша можно расширять и регистрировать через API.

## Базовое использование

### app.cache

`app.cache` — это экземпляр кэша по умолчанию на уровне приложения, который можно использовать напрямую.

```ts
// Установить кэш
await app.cache.set('key', 'value', { ttl: 3600 }); // Единица измерения TTL: секунды

// Получить кэш
const value = await app.cache.get('key');

// Удалить кэш
await this.app.cache.del('key');
```

### ctx.cache

В промежуточном ПО или операциях с ресурсами вы можете получить доступ к кэшу через `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Промах кэша, получить из базы данных
    data = await this.getDataFromDatabase();
    // Сохранить в кэше, срок действия 1 час
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Создание пользовательского кэша

Если вам нужно создать независимый экземпляр кэша (например, с разными пространствами имен или конфигурациями), вы можете использовать метод `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Создать экземпляр кэша с префиксом
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Все ключи будут автоматически иметь этот префикс
      store: 'memory', // Использовать кэш в памяти, необязательно, по умолчанию используется defaultStore
      max: 1000, // Максимальное количество элементов кэша
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Описание параметров createCache

| Параметр | Тип | Описание |
| ---- | ---- | ---- |
| `name` | `string` | Уникальный идентификатор кэша, обязателен |
| `prefix` | `string` | Необязательно, префикс для ключей кэша, используется для предотвращения конфликтов ключей |
| `store` | `string` | Необязательно, идентификатор типа хранилища (например, `'memory'`, `'redis'`), по умолчанию используется `defaultStore` |
| `[key: string]` | `any` | Другие пользовательские параметры конфигурации, связанные с хранилищем |

### Получение созданного кэша

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Основные методы кэша

Экземпляры кэша предоставляют обширные методы для работы с кэшем, большинство из которых унаследованы от `node-cache-manager`.

### get / set

```ts
// Установить кэш со сроком действия (единица измерения: секунды)
await cache.set('key', 'value', { ttl: 3600 });

// Получить кэш
const value = await cache.get('key');
```

### del / reset

```ts
// Удалить отдельный ключ
await cache.del('key');

// Очистить весь кэш
await cache.reset();
```

### wrap

Метод `wrap()` — это очень полезный инструмент, который сначала пытается получить данные из кэша. Если кэш не содержит данных (промах кэша), он выполняет функцию и сохраняет результат в кэше.

```ts
const data = await cache.wrap('user:1', async () => {
  // Эта функция выполняется только при промахе кэша
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Массовые операции

```ts
// Массовая установка
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Массовое получение
const values = await cache.mget(['key1', 'key2', 'key3']);

// Массовое удаление
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Получить все ключи (примечание: некоторые хранилища могут не поддерживать это)
const allKeys = await cache.keys();

// Получить оставшееся время жизни ключа (единица измерения: секунды)
const remainingTTL = await cache.ttl('key');
```

## Расширенное использование

### wrapWithCondition

`wrapWithCondition()` похож на `wrap()`, но позволяет решить, использовать ли кэш, на основе условий.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Внешние параметры контролируют, использовать ли результат из кэша
    useCache: true, // Если установлено в false, функция будет выполнена повторно, даже если кэш существует

    // Решить, кэшировать ли на основе результата данных
    isCacheable: (value) => {
      // Например: кэшировать только успешные результаты
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Операции с кэшем объектов

Когда кэшируемое содержимое является объектом, вы можете использовать следующие методы для непосредственной работы со свойствами объекта, не извлекая весь объект.

```ts
// Установить свойство объекта
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Получить свойство объекта
const name = await cache.getValueInObject('user:1', 'name');

// Удалить свойство объекта
await cache.delValueInObject('user:1', 'age');
```

## Регистрация пользовательского хранилища

Если вам нужно использовать другие типы кэша (например, Memcached, MongoDB и т. д.), вы можете зарегистрировать их с помощью `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Зарегистрировать хранилище Redis (если оно еще не зарегистрировано в системе)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Конфигурация подключения Redis
      url: 'redis://localhost:6379',
    });

    // Создать кэш, используя только что зарегистрированное хранилище
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Важные замечания

1.  **Ограничения кэша в памяти**: При использовании хранилища `memory` убедитесь, что вы установили разумный параметр `max`, чтобы избежать переполнения памяти.
2.  **Стратегия инвалидации кэша**: При обновлении данных не забывайте очищать соответствующий кэш, чтобы избежать устаревших данных.
3.  **Соглашения об именовании ключей**: Рекомендуется использовать осмысленные пространства имен и префиксы, например, `module:resource:id`.
4.  **Настройки TTL**: Устанавливайте TTL разумно, исходя из частоты обновления данных, чтобы сбалансировать производительность и согласованность.
5.  **Подключение Redis**: При использовании Redis убедитесь, что параметры подключения и пароль правильно настроены в производственной среде.