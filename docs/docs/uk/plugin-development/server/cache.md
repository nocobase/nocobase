:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Кешування

Модуль кешування NocoBase базується на бібліотеці <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> та надає функціональність кешування для розробки плагінів. Система має два вбудовані типи кешу:

- **memory** - Кеш у пам'яті, що базується на lru-cache, надається за замовчуванням бібліотекою node-cache-manager.
- **redis** - Кеш Redis, що базується на node-cache-manager-redis-yet.

Інші типи кешу можна розширювати та реєструвати через API.

## Основне використання

### app.cache

`app.cache` — це типовий екземпляр кешу на рівні застосунку, який можна використовувати безпосередньо.

```ts
// Встановлення кешу
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL (час життя) в секундах

// Отримання кешу
const value = await app.cache.get('key');

// Видалення кешу
await this.app.cache.del('key');
```

### ctx.cache

У проміжних обробниках (middleware) або операціях з ресурсами ви можете отримати доступ до кешу через `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Кеш не знайдено, отримуємо дані з бази даних
    data = await this.getDataFromDatabase();
    // Зберігаємо в кеші, термін дії 1 година
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Створення власного кешу

Якщо вам потрібно створити незалежний екземпляр кешу (наприклад, з різними просторами імен або конфігураціями), ви можете скористатися методом `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Створення екземпляра кешу з префіксом
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // До всіх ключів автоматично додаватиметься цей префікс
      store: 'memory', // Використовувати кеш у пам'яті, необов'язково, за замовчуванням використовується defaultStore
      max: 1000, // Максимальна кількість елементів кешу
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### Опис параметрів `createCache`

| Параметр | Тип | Опис |
| -------- | ---- | ---------- |
| `name` | `string` | Унікальний ідентифікатор кешу, обов'язковий |
| `prefix` | `string` | Необов'язково, префікс для ключів кешу, використовується для уникнення конфліктів ключів |
| `store` | `string` | Необов'язково, ідентифікатор типу сховища (наприклад, `'memory'`, `'redis'`), за замовчуванням використовується `defaultStore` |
| `[key: string]` | `any` | Інші користувацькі параметри конфігурації, пов'язані зі сховищем |

### Отримання створеного кешу

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Основні методи кешування

Екземпляри кешу надають широкий набір методів для роботи з кешем, більшість з яких успадковані від `node-cache-manager`.

### get / set

```ts
// Встановлення кешу з терміном дії (в секундах)
await cache.set('key', 'value', { ttl: 3600 });

// Отримання кешу
const value = await cache.get('key');
```

### del / reset

```ts
// Видалення одного ключа
await cache.del('key');

// Очищення всього кешу
await cache.reset();
```

### wrap

Метод `wrap()` — це дуже корисний інструмент, який спочатку намагається отримати дані з кешу. Якщо кеш не знайдено, він виконує функцію та зберігає результат у кеші.

```ts
const data = await cache.wrap('user:1', async () => {
  // Ця функція виконується лише у випадку, якщо кеш не знайдено
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Пакетні операції

```ts
// Пакетне встановлення
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Пакетне отримання
const values = await cache.mget(['key1', 'key2', 'key3']);

// Пакетне видалення
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Отримання всіх ключів (примітка: деякі сховища можуть не підтримувати це)
const allKeys = await cache.keys();

// Отримання часу, що залишився до закінчення терміну дії ключа (в секундах)
const remainingTTL = await cache.ttl('key');
```

## Розширене використання

### wrapWithCondition

`wrapWithCondition()` схожий на `wrap()`, але дозволяє вирішувати, чи використовувати кеш, на основі певних умов.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Зовнішні параметри контролюють, чи використовувати результат з кешу
    useCache: true, // Якщо встановлено на false, функція буде виконана повторно, навіть якщо кеш існує

    // Вирішення, чи кешувати, на основі результату даних
    isCacheable: (value) => {
      // Наприклад: кешувати лише успішні результати
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Операції з об'єктним кешем

Коли вміст кешу є об'єктом, ви можете використовувати наступні методи для безпосередньої роботи з властивостями об'єкта, не отримуючи весь об'єкт.

```ts
// Встановлення певної властивості об'єкта
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Отримання певної властивості об'єкта
const name = await cache.getValueInObject('user:1', 'name');

// Видалення певної властивості об'єкта
await cache.delValueInObject('user:1', 'age');
```

## Реєстрація власного сховища (Store)

Якщо вам потрібно використовувати інші типи кешу (наприклад, Memcached, MongoDB тощо), ви можете зареєструвати їх за допомогою `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Реєстрація сховища Redis (якщо система ще не зареєструвала його)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Конфігурація підключення Redis
      url: 'redis://localhost:6379',
    });

    // Створення кешу за допомогою щойно зареєстрованого сховища
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Важливі зауваження

1.  **Обмеження кешу в пам'яті**: При використанні сховища `memory` зверніть увагу на встановлення розумного параметра `max`, щоб уникнути переповнення пам'яті.
2.  **Стратегія анулювання кешу**: При оновленні даних не забувайте очищати відповідний кеш, щоб уникнути неактуальних даних.
3.  **Правила іменування ключів**: Рекомендується використовувати змістовні простори імен та префікси, наприклад, `module:resource:id`.
4.  **Налаштування TTL**: Встановлюйте TTL (час життя) розумно, виходячи з частоти оновлення даних, щоб збалансувати продуктивність та узгодженість.
5.  **Підключення Redis**: При використанні Redis переконайтеся, що параметри підключення та пароль правильно налаштовані у виробничому середовищі.