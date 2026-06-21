# Кэш

Модуль кэша NocoBase основан на <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> и предоставляет возможность кэширования для разработки плагинов. В системе есть два встроенных типа кэша:

- **memory** — кэш в памяти на основе `lru-cache`, предоставляемый `node-cache-manager` по умолчанию.
- **redis** — кэш Redis на основе `node-cache-manager-redis-yet`.

Дополнительные типы кэша можно расширить и зарегистрировать через API.

## Основное использование

### app.cache

`app.cache` — это экземпляр кэша по умолчанию на уровне приложения, который можно использовать напрямую.

```ts
// Установить значение кэша
await app.cache.set('key', 'value', { ttl: 3600 }); // Единица TTL: секунды

// Получить значение кэша
const value = await app.cache.get('key');

// Удалить значение кэша
await this.app.cache.del('key');
```

### ctx.cache

В промежуточном программном обеспечении или операциях с ресурсами вы можете получить доступ к кешу через `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Промах кэша, получаем данные из базы данных
    data = await this.getDataFromDatabase();
    // Сохранить в кэше, срок действия 1 час
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Создание собственного кэша

Если вам необходимо создать независимый экземпляр кэша (например, различные пространства имен или конфигурации), вы можете использовать метод `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Создать экземпляр кэша с префиксом
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Этот префикс будет автоматически добавляться ко всем ключам
      store: 'memory', // Использовать кэш в памяти; необязательно, по умолчанию используется defaultStore
      max: 1000, // Максимальное количество элементов в кэше
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Описание параметров `createCache`

| Параметр | Тип | Описание |
| -------- | ---- | ---------- |
| `name` | `string` | Требуется уникальный идентификатор кэша |
| `prefix` | `string` | Необязательно, префикс для ключей кэша, используемый во избежание конфликтов ключей |
| `store` | `string` | Необязательный идентификатор типа хранилища (например, `'memory'`, `'redis'`), по умолчанию `defaultStore` |
| `[key: string]` | `any` | Другие элементы пользовательской конфигурации, связанные с хранилищем |

### Получение созданного кэша

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Основные методы кэширования

Экземпляры `Cache` предоставляют широкий набор методов работы с кэшем, большинство из которых унаследованы от `node-cache-manager`.

### Получение и установка (`get` / `set`)

```ts
// Установить кэш с временем истечения (единица: секунды)
await cache.set('key', 'value', { ttl: 3600 });

// Получить кэш
const value = await cache.get('key');
```

### Удаление и сброс (`del` / `reset`)

```ts
// Удалить один ключ
await cache.del('key');

// Очистить весь кэш
await cache.reset();
```

### Обертка (`wrap`)

Метод `wrap()` сначала пытается получить данные из кэша, а при промахе выполняет функцию и сохраняет результат в кэше.

```ts
const data = await cache.wrap('user:1', async () => {
  // Эта функция выполняется только при промахе кэша
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Пакетные операции

```ts
// Пакетная установка
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Пакетное получение
const values = await cache.mget(['key1', 'key2', 'key3']);

// Пакетное удаление
await cache.mdel(['key1', 'key2', 'key3']);
```

### Ключи и TTL (`keys` / `ttl`)

```ts
// Получить все ключи (обратите внимание: некоторые хранилища могут не поддерживать это)
const allKeys = await cache.keys();

// Получить оставшееся время истечения для ключа (единица: секунды)
const remainingTTL = await cache.ttl('key');
```

## Расширенное использование

### Обертка с условием (`wrapWithCondition`)

`wrapWithCondition()` похож на `wrap()`, но может решать, использовать ли кэш через условия.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Внешние параметры определяют, использовать ли результат кэша
    useCache: true, // Если установить в false, функция выполнится повторно, даже если кэш существует

    // Решить, кэшировать ли данные на основе результата
    isCacheable: (value) => {
      // Например: кэшировать только успешные результаты
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Операции с кэшем объектов

Если кэшированное содержимое является объектом, вы можете использовать следующие методы для непосредственного управления свойствами объекта, не получая весь объект.

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

Если вам необходимо использовать другие типы кэша (например, Memcached, MongoDB и т. д.), вы можете зарегистрировать их через `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Зарегистрировать хранилище Redis (если система его еще не зарегистрировала)
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

## Примечания

1. **Ограничения кэша памяти**. При использовании хранилища памяти обратите внимание на настройку разумного параметра `max`, чтобы избежать переполнения памяти.
2. **Стратегия аннулирования кэша**: не забудьте очистить соответствующий кеш при обновлении данных, чтобы избежать загрязнения данных.
3. **Соглашение об именах ключей**. Рекомендуется использовать осмысленные пространства имен и префиксы, например `module:resource:id`.
4. **Настройки TTL**: разумно устанавливайте TTL в зависимости от частоты обновления данных, чтобы сбалансировать производительность и согласованность.
5. **Подключение Redis**. При использовании Redis убедитесь, что параметры подключения и пароли правильно настроены в производственной среде.