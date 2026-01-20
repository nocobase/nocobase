:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מטמון

מודול המטמון של NocoBase מבוסס על <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> ומספק פונקציונליות מטמון לפיתוח תוספים. המערכת כוללת שני סוגי מטמון מובנים:

- **memory** - מטמון זיכרון המבוסס על lru-cache, המסופק כברירת מחדל על ידי node-cache-manager
- **redis** - מטמון Redis המבוסס על node-cache-manager-redis-yet

ניתן להרחיב ולרשום סוגי מטמון נוספים באמצעות ה-API.

## שימוש בסיסי

### app.cache

`app.cache` הוא מופע המטמון המוגדר כברירת מחדל ברמת היישום, וניתן להשתמש בו ישירות.

```ts
// הגדרת מטמון
await app.cache.set('key', 'value', { ttl: 3600 }); // יחידת TTL: שניות

// קבלת מטמון
const value = await app.cache.get('key');

// מחיקת מטמון
await this.app.cache.del('key');
```

### ctx.cache

בפעולות Middleware או משאבים, תוכלו לגשת למטמון באמצעות `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // המטמון לא נמצא, קבל מהמסד נתונים
    data = await this.getDataFromDatabase();
    // שמור במטמון, תקף לשעה אחת
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## יצירת מטמון מותאם אישית

אם אתם צריכים ליצור מופע מטמון עצמאי (לדוגמה, מרחבי שמות או תצורות שונים), תוכלו להשתמש במתודה `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // יצירת מופע מטמון עם קידומת
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // כל המפתחות יקבלו אוטומטית קידומת זו
      store: 'memory', // שימוש במטמון זיכרון, אופציונלי, ברירת המחדל היא defaultStore
      max: 1000, // מספר פריטי המטמון המקסימלי
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### תיאור פרמטרים של createCache

| פרמטר | סוג | תיאור |
| ---- | ---- | ---- |
| `name` | `string` | מזהה ייחודי למטמון, חובה |
| `prefix` | `string` | אופציונלי, קידומת למפתחות המטמון, למניעת התנגשויות מפתחות |
| `store` | `string` | אופציונלי, מזהה סוג ה-store (כגון `'memory'`, `'redis'`), ברירת המחדל היא `defaultStore` |
| `[key: string]` | `any` | פריטי תצורה מותאמים אישית אחרים הקשורים ל-store |

### קבלת מטמון קיים

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## מתודות מטמון בסיסיות

מופעי מטמון מספקים מגוון עשיר של מתודות פעולות מטמון, רובן יורשות מ-node-cache-manager.

### get / set

```ts
// הגדרת מטמון, עם זמן תפוגה (יחידה: שניות)
await cache.set('key', 'value', { ttl: 3600 });

// קבלת מטמון
const value = await cache.get('key');
```

### del / reset

```ts
// מחיקת מפתח בודד
await cache.del('key');

// ניקוי כל המטמון
await cache.reset();
```

### wrap

המתודה `wrap()` היא כלי שימושי מאוד: היא מנסה תחילה לקבל נתונים מהמטמון, ואם המטמון לא נמצא, היא מבצעת את הפונקציה ושומרת את התוצאה במטמון.

```ts
const data = await cache.wrap('user:1', async () => {
  // פונקציה זו מבוצעת רק כאשר המטמון לא נמצא
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### פעולות אצווה

```ts
// הגדרת אצווה
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// קבלת אצווה
const values = await cache.mget(['key1', 'key2', 'key3']);

// מחיקת אצווה
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// קבלת כל המפתחות (שימו לב: ייתכן שחלק מה-stores אינם תומכים בכך)
const allKeys = await cache.keys();

// קבלת זמן התפוגה הנותר עבור מפתח (יחידה: שניות)
const remainingTTL = await cache.ttl('key');
```

## שימוש מתקדם

### wrapWithCondition

`wrapWithCondition()` דומה ל-`wrap()`, אך מאפשרת להחליט אם להשתמש במטמון באמצעות תנאים.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // פרמטרים חיצוניים השולטים אם להשתמש בתוצאת המטמון
    useCache: true, // אם מוגדר כ-false, הפונקציה תבוצע מחדש גם אם קיים מטמון

    // החלטה אם לשמור במטמון בהתבסס על תוצאת הנתונים
    isCacheable: (value) => {
      // לדוגמה: שמור במטמון רק תוצאות מוצלחות
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### פעולות מטמון אובייקטים

כאשר תוכן המטמון הוא אובייקט, תוכלו להשתמש במתודות הבאות כדי לתפעל ישירות את מאפייני האובייקט, מבלי לקבל את האובייקט כולו.

```ts
// הגדרת מאפיין מסוים של אובייקט
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// קבלת מאפיין מסוים של אובייקט
const name = await cache.getValueInObject('user:1', 'name');

// מחיקת מאפיין מסוים של אובייקט
await cache.delValueInObject('user:1', 'age');
```

## רישום Store מותאם אישית

אם אתם צריכים להשתמש בסוגי מטמון אחרים (כגון Memcached, MongoDB וכו'), תוכלו לרשום אותם באמצעות `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // רישום Redis store (אם המערכת עדיין לא רשמה אותו)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // תצורת חיבור ל-Redis
      url: 'redis://localhost:6379',
    });

    // יצירת מטמון באמצעות ה-store החדש שנרשם
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## הערות

1.  **מגבלות מטמון זיכרון**: בעת שימוש ב-memory store, שימו לב להגדיר פרמטר `max` סביר כדי למנוע גלישת זיכרון.
2.  **אסטרטגיית ביטול תוקף מטמון**: בעת עדכון נתונים, זכרו לנקות את המטמון הרלוונטי כדי למנוע נתונים מיושנים.
3.  **מוסכמות שמות מפתחות**: מומלץ להשתמש במרחבי שמות וקידומות בעלי משמעות, כגון `module:resource:id`.
4.  **הגדרות TTL**: הגדירו TTL באופן סביר בהתבסס על תדירות עדכון הנתונים, כדי לאזן בין ביצועים לעקביות.
5.  **חיבור Redis**: בעת שימוש ב-Redis, ודאו שפרמטרי החיבור והסיסמאות מוגדרים נכון בסביבת ייצור.