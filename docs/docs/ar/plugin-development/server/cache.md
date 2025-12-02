:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# ذاكرة التخزين المؤقت

تعتمد وحدة ذاكرة التخزين المؤقت في NocoBase على <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>، وتوفر وظائف التخزين المؤقت لتطوير الإضافات. يتضمن النظام نوعين مدمجين من ذاكرة التخزين المؤقت:

- **memory** - ذاكرة تخزين مؤقت قائمة على الذاكرة (memory cache) تستند إلى `lru-cache`، ويوفرها `node-cache-manager` افتراضيًا.
- **redis** - ذاكرة تخزين مؤقت من نوع Redis تستند إلى `node-cache-manager-redis-yet`.

يمكن توسيع وتسجيل المزيد من أنواع ذاكرة التخزين المؤقت عبر واجهة برمجة التطبيقات (API).

## الاستخدام الأساسي

### `app.cache`

`app.cache` هو مثيل ذاكرة التخزين المؤقت الافتراضي على مستوى التطبيق، ويمكن استخدامه مباشرة.

```ts
// تعيين قيمة في ذاكرة التخزين المؤقت
await app.cache.set('key', 'value', { ttl: 3600 }); // وحدة TTL: ثوانٍ

// استرداد قيمة من ذاكرة التخزين المؤقت
const value = await app.cache.get('key');

// حذف قيمة من ذاكرة التخزين المؤقت
await this.app.cache.del('key');
```

### `ctx.cache`

في عمليات البرمجيات الوسيطة (middleware) أو عمليات الموارد، يمكنك الوصول إلى ذاكرة التخزين المؤقت عبر `ctx.cache`.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // لم يتم العثور على البيانات في ذاكرة التخزين المؤقت، يتم جلبها من قاعدة البيانات
    data = await this.getDataFromDatabase();
    // تخزين البيانات في ذاكرة التخزين المؤقت، صالحة لمدة ساعة واحدة
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## إنشاء ذاكرة تخزين مؤقت مخصصة

إذا كنت بحاجة إلى إنشاء مثيل ذاكرة تخزين مؤقت مستقل (على سبيل المثال، لمساحات أسماء أو تكوينات مختلفة)، يمكنك استخدام الدالة `app.cacheManager.createCache()`.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // إنشاء مثيل ذاكرة تخزين مؤقت مع بادئة
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // ستتم إضافة هذه البادئة تلقائيًا إلى جميع المفاتيح
      store: 'memory', // استخدام مخزن الذاكرة المؤقتة (memory cache)، اختياري، يستخدم defaultStore افتراضيًا
      max: 1000, // الحد الأقصى لعدد عناصر ذاكرة التخزين المؤقت
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### وصف معاملات `createCache`

| المعامل | النوع | الوصف |
| ---- | ---- | ---- |
| `name` | `string` | المعرّف الفريد لذاكرة التخزين المؤقت، إلزامي |
| `prefix` | `string` | اختياري، بادئة لمفاتيح ذاكرة التخزين المؤقت، تُستخدم لتجنب تعارض المفاتيح |
| `store` | `string` | اختياري، معرّف نوع المخزن (مثل `'memory'`، `'redis'`)، يستخدم `defaultStore` افتراضيًا |
| `[key: string]` | `any` | عناصر التكوين المخصصة الأخرى المتعلقة بالمخزن |

### استرداد ذاكرة التخزين المؤقت التي تم إنشاؤها

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## دوال ذاكرة التخزين المؤقت الأساسية

توفر مثيلات ذاكرة التخزين المؤقت دوال غنية لعمليات التخزين المؤقت، ومعظم هذه الدوال موروثة من `node-cache-manager`.

### `get` / `set`

```ts
// تعيين قيمة في ذاكرة التخزين المؤقت مع وقت انتهاء صلاحية (الوحدة: ثوانٍ)
await cache.set('key', 'value', { ttl: 3600 });

// استرداد قيمة من ذاكرة التخزين المؤقت
const value = await cache.get('key');
```

### `del` / `reset`

```ts
// حذف مفتاح واحد
await cache.del('key');

// مسح جميع عناصر ذاكرة التخزين المؤقت
await cache.reset();
```

### `wrap`

تُعد الدالة `wrap()` أداة مفيدة للغاية، حيث تحاول أولاً جلب البيانات من ذاكرة التخزين المؤقت، وإذا لم يتم العثور عليها (cache miss)، فإنها تنفذ الدالة ثم تخزن النتيجة في ذاكرة التخزين المؤقت.

```ts
const data = await cache.wrap('user:1', async () => {
  // تُنفذ هذه الدالة فقط في حال عدم وجود البيانات في ذاكرة التخزين المؤقت
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### العمليات الدفعية

```ts
// تعيين دفعي
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// استرداد دفعي
const values = await cache.mget(['key1', 'key2', 'key3']);

// حذف دفعي
await cache.mdel(['key1', 'key2', 'key3']);
```

### `keys` / `ttl`

```ts
// استرداد جميع المفاتيح (ملاحظة: قد لا تدعم بعض المخازن هذه العملية)
const allKeys = await cache.keys();

// استرداد مدة البقاء المتبقية للمفتاح (الوحدة: ثوانٍ)
const remainingTTL = await cache.ttl('key');
```

## الاستخدام المتقدم

### `wrapWithCondition`

تُشبه الدالة `wrapWithCondition()` الدالة `wrap()`، ولكنها تتيح لك تحديد ما إذا كنت ستستخدم ذاكرة التخزين المؤقت بناءً على شروط معينة.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // تتحكم المعاملات الخارجية فيما إذا كان سيتم استخدام نتيجة ذاكرة التخزين المؤقت
    useCache: true, // إذا تم تعيينها إلى false، فسيتم إعادة تنفيذ الدالة حتى لو كانت البيانات موجودة في ذاكرة التخزين المؤقت

    // تحديد ما إذا كان سيتم التخزين المؤقت بناءً على نتيجة البيانات
    isCacheable: (value) => {
      // على سبيل المثال: تخزين النتائج الناجحة فقط
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### عمليات ذاكرة التخزين المؤقت للكائنات

عندما يكون المحتوى المخزن مؤقتًا كائنًا، يمكنك استخدام الدوال التالية للتعامل مباشرة مع خصائص الكائن دون الحاجة إلى استرداد الكائن بأكمله.

```ts
// تعيين خاصية معينة لكائن
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// استرداد خاصية معينة لكائن
const name = await cache.getValueInObject('user:1', 'name');

// حذف خاصية معينة لكائن
await cache.delValueInObject('user:1', 'age');
```

## تسجيل مخزن مخصص

إذا كنت بحاجة إلى استخدام أنواع أخرى من ذاكرة التخزين المؤقت (مثل Memcached أو MongoDB وما إلى ذلك)، يمكنك تسجيلها عبر الدالة `app.cacheManager.registerStore()`.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // تسجيل مخزن Redis (إذا لم يكن النظام قد سجله بالفعل)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // إعدادات اتصال Redis
      url: 'redis://localhost:6379',
    });

    // إنشاء ذاكرة تخزين مؤقت باستخدام المخزن المسجل حديثًا
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## ملاحظات هامة

1.  **حدود ذاكرة التخزين المؤقت في الذاكرة**: عند استخدام مخزن الذاكرة (memory store)، احرص على تعيين معامل `max` بقيمة معقولة لتجنب تجاوز سعة الذاكرة.
2.  **استراتيجية إبطال ذاكرة التخزين المؤقت**: عند تحديث البيانات، تذكر مسح ذاكرة التخزين المؤقت ذات الصلة لتجنب البيانات القديمة/غير المتزامنة.
3.  **اتفاقيات تسمية المفاتيح**: يُنصح باستخدام مساحات أسماء وبادئات ذات معنى، مثل `module:resource:id`.
4.  **إعدادات مدة البقاء (TTL)**: اضبط مدة البقاء (TTL) بشكل معقول بناءً على تكرار تحديث البيانات لتحقيق التوازن بين الأداء والاتساق.
5.  **اتصال Redis**: عند استخدام Redis، تأكد من تكوين معاملات الاتصال وكلمات المرور بشكل صحيح في بيئة الإنتاج.