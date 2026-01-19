:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# CacheManager

## نظرة عامة

يعتمد CacheManager على <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a>، ويوفر وظائف إدارة وحدة الذاكرة المؤقتة لـ NocoBase. أنواع الذاكرة المؤقتة المدمجة هي:

-   `memory` - ذاكرة التخزين المؤقت LRU التي يوفرها `node-cache-manager` افتراضيًا.
-   `redis` - مدعومة بالوظائف ذات الصلة من `node-cache-manager-redis-yet`.

يمكن تسجيل وتوسيع المزيد من الأنواع عبر واجهة برمجة التطبيقات (API).

### مفاهيم أساسية

-   **Store (المخزن)**: يحدد طريقة تخزين مؤقت، تتضمن طريقة مصنع لإنشاء الذاكرة المؤقتة، وتكوينات أخرى ذات صلة. لكل طريقة تخزين مؤقت معرف فريد يتم توفيره أثناء التسجيل.
    المعرفات الفريدة لطريقتي التخزين المؤقت المدمجتين هما `memory` و `redis`.

-   **Store Factory Method (طريقة مصنع المخزن)**: طريقة توفرها `node-cache-manager` وحزم التوسيع ذات الصلة لإنشاء الذاكرة المؤقتة. على سبيل المثال، `'memory'` التي يوفرها `node-cache-manager` افتراضيًا، و `redisStore` التي يوفرها `node-cache-manager-redis-yet`. هذا يتوافق مع المعامل الأول لطريقة `caching` في `node-cache-manager`.

-   **Cache (الذاكرة المؤقتة)**: فئة مغلفة بواسطة NocoBase توفر طرقًا لاستخدام الذاكرة المؤقتة. عند استخدام الذاكرة المؤقتة فعليًا، يتم التعامل مع مثيل من `Cache`. لكل مثيل `Cache` معرف فريد، والذي يمكن استخدامه كمساحة اسم لتمييز الوحدات المختلفة.

## طرق الفئة

### `constructor()`

#### التوقيع

-   `constructor(options?: CacheManagerOptions)`

#### الأنواع

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

#### التفاصيل

##### CacheManagerOptions

| الخاصية           | النوع                           | الوصف                                                                                                                                                                                                                         |
| :--------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore`   | `string`                       | المعرف الفريد لنوع الذاكرة المؤقتة الافتراضي.                                                                                                                                                                                   |
| `stores`         | `Record<string, StoreOptions>` | يسجل أنواع الذاكرة المؤقتة. المفتاح هو المعرف الفريد لنوع الذاكرة المؤقتة، والقيمة هي كائن يحتوي على طريقة التسجيل والتكوين العام لنوع الذاكرة المؤقتة.<br />في `node-cache-manager`، طريقة إنشاء الذاكرة المؤقتة هي `await caching(store, config)`. الكائن الذي يجب توفيره هنا هو [`StoreOptions`](#storeoptions). |

##### StoreOptions

| الخاصية          | النوع                                   | الوصف                                                                                                                                                                                            |
| :-------------- | :------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `store`         | `memory` \| `FactoryStore<Store, any>` | طريقة مصنع المخزن، تتوافق مع المعامل الأول لـ `caching`.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | اختياري. بالنسبة للبرمجيات الوسيطة مثل Redis التي تتطلب اتصالاً، يجب توفير طريقة رد اتصال لإغلاق الاتصال. المعامل المدخل هو الكائن الذي تُرجعه طريقة مصنع المخزن. |
| `[key: string]` | `any`                                  | تكوينات المخزن العامة الأخرى، تتوافق مع المعامل الثاني لـ `caching`.                                                                                                               |

#### الخيارات الافتراضية (`options`)

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // global config
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

سيتم دمج معامل `options` مع الخيارات الافتراضية. يمكن حذف الخصائص الموجودة بالفعل في الخيارات الافتراضية. على سبيل المثال:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore is already provided in the default options, so you only need to provide the redisStore configuration.
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

تسجل طريقة تخزين مؤقت جديدة. على سبيل المثال:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // unique identifier for the store
  name: 'redis',
  // factory method to create the store
  store: redisStore,
  // close the store connection
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // global config
  url: 'xxx',
});
```

#### التوقيع

-   `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

تنشئ ذاكرة مؤقتة. على سبيل المثال:

```ts
await cacheManager.createCache({
  name: 'default', // unique identifier for the cache
  store: 'memory', // unique identifier for the store
  prefix: 'mycache', // automatically adds 'mycache:' prefix to cache keys, optional
  // other store configurations, custom configs will be merged with the global store config
  max: 2000,
});
```

#### التوقيع

-   `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### التفاصيل

##### options

| الخاصية          | النوع     | الوصف                                           |
| :-------------- | :------- | :---------------------------------------------- |
| `name`          | `string` | المعرف الفريد للذاكرة المؤقتة.                      |
| `store`         | `string` | المعرف الفريد للمخزن.                      |
| `prefix`        | `string` | اختياري، بادئة مفتاح الذاكرة المؤقتة.           |
| `[key: string]` | `any`    | عناصر التكوين المخصصة الأخرى المتعلقة بالمخزن. |

إذا تم حذف `store`، فسيتم استخدام `defaultStore`. في هذه الحالة، ستتغير طريقة التخزين المؤقت وفقًا لطريقة التخزين المؤقت الافتراضية للنظام.

عند عدم وجود تكوينات مخصصة، تُرجع مساحة الذاكرة المؤقتة الافتراضية التي تم إنشاؤها بواسطة التكوين العام والمشتركة بواسطة طريقة التخزين المؤقت الحالية. يوصى بإضافة `prefix` لتجنب تعارض المفاتيح.

```ts
// Use the default cache with global configuration
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

راجع [الذاكرة المؤقتة](./cache.md)

### `getCache()`

يحصل على الذاكرة المؤقتة المطابقة.

```ts
cacheManager.getCache('default');
```

#### التوقيع

-   `getCache(name: string): Cache`

### `flushAll()`

يعيد تعيين جميع الذاكرات المؤقتة.

```ts
await cacheManager.flushAll();
```

### `close()`

يغلق جميع اتصالات البرمجيات الوسيطة للذاكرة المؤقتة.

```ts
await cacheManager.close();
```