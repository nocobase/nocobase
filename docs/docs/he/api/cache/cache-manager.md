:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# CacheManager

## סקירה כללית

CacheManager מבוסס על <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> ומספק יכולות ניהול מודולי מטמון עבור NocoBase. סוגי המטמון המובנים הם:

- memory - מטמון lru המסופק כברירת מחדל על ידי node-cache-manager
- redis - נתמך על ידי node-cache-manager-redis-yet

ניתן לרשום ולהרחיב סוגים נוספים באמצעות ה-API.

### מושגים

- **Store**: מגדיר שיטת שמירה במטמון, הכוללת שיטת יצרן (factory method) ליצירת מטמונים, ותצורות קשורות נוספות. לכל שיטת שמירה במטמון יש מזהה ייחודי המסופק בעת הרישום.
  המזהים הייחודיים לשתי שיטות השמירה במטמון המובנות הם `memory` ו-`redis`.

- **שיטת יצרן (Factory Method) של Store**: שיטה המסופקת על ידי `node-cache-manager` וחבילות הרחבה קשורות, המשמשת ליצירת מטמונים. לדוגמה, `'memory'` המסופק כברירת מחדל על ידי `node-cache-manager`, ו-`redisStore` המסופק על ידי `node-cache-manager-redis-yet`. זוהי למעשה הפרמטר הראשון של שיטת `caching` ב-`node-cache-manager`.

- **Cache**: מחלקה עטופה על ידי NocoBase, המספקת שיטות לשימוש במטמון. בעת שימוש בפועל במטמון, אתם פועלים על מופע של `Cache`. לכל מופע `Cache` יש מזהה ייחודי, שיכול לשמש כמרחב שמות (namespace) להבחנה בין מודולים שונים.

## שיטות מחלקה

### `constructor()`

#### חתימה

- `constructor(options?: CacheManagerOptions)`

#### סוגים

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

#### פרטים

##### CacheManagerOptions

| מאפיין        | סוג                            | תיאור                                                                                                                                                                                                                         |
| -------------- | ------------------------------ | המזהה הייחודי של סוג המטמון ברירת המחדל.                                                                                                                                                                              |
| `defaultStore` | `string`                       | רושם סוגי מטמון. המפתח הוא המזהה הייחודי של סוג המטמון, והערך הוא אובייקט המכיל את שיטת הרישום והתצורה הגלובלית עבור סוג המטמון.<br />ב-`node-cache-manager`, השיטה ליצירת מטמון היא `await caching(store, config)`. האובייקט שיש לספק כאן הוא [`StoreOptions`](#storeoptions). |
| `stores`       | `Record<string, StoreOptions>` |

##### StoreOptions

| מאפיין         | סוג                                    | תיאור                                                                                                                                                                                            |
| --------------- | -------------------------------------- | שיטת יצרן (factory method) של ה-store, מתאימה לפרמטר הראשון של `caching`.                                                                                                                         |
| `store`         | `memory` \| `FactoryStore<Store, any>` | אופציונלי. עבור תוכנות ביניים (middleware) כמו Redis הדורשות חיבור, יש לספק שיטת קריאה חוזרת (callback) לסגירת החיבור. הפרמטר הקלט הוא האובייקט המוחזר על ידי שיטת היצרן של ה-store. |
| `close`         | `(store: Store) => Promise<void>`      | תצורות גלובליות נוספות של ה-store, מתאימות לפרמטר השני של `caching`.                                                                                                               |
| `[key: string]` | `any`                                  |

#### אפשרויות ברירת מחדל

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // תצורה גלובלית
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

הפרמטר `options` ימוזג עם אפשרויות ברירת המחדל. ניתן להשמיט מאפיינים שכבר קיימים באפשרויות ברירת המחדל. לדוגמה:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore כבר מסופק באפשרויות ברירת המחדל, לכן יש לספק רק את תצורת ה-redisStore.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

רושם שיטת שמירה במטמון חדשה. לדוגמה:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // מזהה ייחודי עבור ה-store
  name: 'redis',
  // שיטת יצרן (factory method) ליצירת ה-store
  store: redisStore,
  // סגירת חיבור ה-store
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // תצורה גלובלית
  url: 'xxx',
});
```

#### חתימה

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

יוצר מטמון. לדוגמה:

```ts
await cacheManager.createCache({
  name: 'default', // מזהה ייחודי עבור המטמון
  store: 'memory', // מזהה ייחודי עבור ה-store
  prefix: 'mycache', // מוסיף אוטומטית את הקידומת 'mycache:' למפתחות המטמון, אופציונלי
  // תצורות store נוספות, תצורות מותאמות אישית ימוזגו עם התצורה הגלובלית של ה-store
  max: 2000,
});
```

#### חתימה

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### פרטים

##### options

| מאפיין         | סוג     | תיאור                                           |
| --------------- | -------- | ----------------------------------------------- |
| `name`          | `string` | מזהה ייחודי עבור המטמון.                      |
| `store`         | `string` | מזהה ייחודי עבור ה-store.                      |
| `prefix`        | `string` | אופציונלי, קידומת למפתח המטמון.           |
| `[key: string]` | `any`    | פריטי תצורה מותאמים אישית נוספים הקשורים ל-store. |

אם `store` מושמט, ייעשה שימוש ב-`defaultStore`. במקרה זה, שיטת השמירה במטמון תשתנה בהתאם לשיטת השמירה במטמון המוגדרת כברירת מחדל של המערכת.

כאשר אין תצורות מותאמות אישית, יוחזר מרחב המטמון ברירת המחדל שנוצר על ידי התצורה הגלובלית ומשותף לשיטת השמירה במטמון הנוכחית. מומלץ להוסיף `prefix` כדי למנוע התנגשויות מפתחות.

```ts
// שימוש במטמון ברירת המחדל, עם תצורה גלובלית
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

ראו [Cache](./cache.md)

### `getCache()`

מקבל את המטמון המתאים.

```ts
cacheManager.getCache('default');
```

#### חתימה

- `getCache(name: string): Cache`

### `flushAll()`

מאפס את כל המטמונים.

```ts
await cacheManager.flushAll();
```

### `close()`

סוגר את כל חיבורי תוכנות הביניים (middleware) של המטמון.

```ts
await cacheManager.close();
```