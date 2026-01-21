:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# कैश

NocoBase का कैश मॉड्यूल <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> पर आधारित है और प्लगइन (plugin) डेवलपमेंट के लिए कैशिंग (caching) कार्यक्षमता प्रदान करता है। सिस्टम में दो अंतर्निहित कैश प्रकार हैं:

- **memory** - lru-cache पर आधारित मेमोरी कैश, जो node-cache-manager द्वारा डिफ़ॉल्ट रूप से प्रदान किया जाता है
- **redis** - node-cache-manager-redis-yet पर आधारित Redis कैश

अन्य कैश प्रकारों को API के माध्यम से बढ़ाया और रजिस्टर किया जा सकता है।

## बुनियादी उपयोग

### app.cache

`app.cache` एप्लिकेशन-स्तर का डिफ़ॉल्ट कैश इंस्टेंस है और इसे सीधे इस्तेमाल किया जा सकता है।

```ts
// कैश सेट करें
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL इकाई: सेकंड

// कैश प्राप्त करें
const value = await app.cache.get('key');

// कैश डिलीट करें
await this.app.cache.del('key');
```

### ctx.cache

मिडलवेयर (middleware) या रिसोर्स (resource) ऑपरेशंस में, आप `ctx.cache` के माध्यम से कैश को एक्सेस कर सकते हैं।

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // कैश मिस होने पर, डेटाबेस से प्राप्त करें
    data = await this.getDataFromDatabase();
    // कैश में स्टोर करें, 1 घंटे के लिए वैध
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## कस्टम कैश बनाएं

यदि आपको एक स्वतंत्र कैश इंस्टेंस (उदाहरण के लिए, अलग-अलग नेमस्पेस या कॉन्फ़िगरेशन) बनाने की आवश्यकता है, तो आप `app.cacheManager.createCache()` मेथड का उपयोग कर सकते हैं।

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // प्रीफ़िक्स के साथ एक कैश इंस्टेंस बनाएं
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // सभी key में यह प्रीफ़िक्स अपने आप जुड़ जाएगा
      store: 'memory', // मेमोरी कैश का उपयोग करें, वैकल्पिक, डिफ़ॉल्ट रूप से defaultStore का उपयोग करता है
      max: 1000, // कैश आइटम की अधिकतम संख्या
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache पैरामीटर विवरण

| पैरामीटर | प्रकार | विवरण |
| ---- | ---- | ---- |
| `name` | `string` | कैश के लिए अद्वितीय पहचानकर्ता, आवश्यक |
| `prefix` | `string` | वैकल्पिक, कैश key के लिए प्रीफ़िक्स, key के टकराव से बचने के लिए उपयोग किया जाता है |
| `store` | `string` | वैकल्पिक, स्टोर प्रकार पहचानकर्ता (जैसे `'memory'`, `'redis'`), डिफ़ॉल्ट रूप से `defaultStore` का उपयोग करता है |
| `[key: string]` | `any` | अन्य स्टोर-संबंधित कस्टम कॉन्फ़िगरेशन आइटम |

### बनाए गए कैश को प्राप्त करें

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## कैश के बुनियादी तरीके

कैश इंस्टेंस (instance) कई कैश ऑपरेशन मेथड प्रदान करते हैं, जिनमें से अधिकांश node-cache-manager से इनहेरिट किए गए हैं।

### get / set

```ts
// कैश सेट करें, समय-सीमा (सेकंड में) के साथ
await cache.set('key', 'value', { ttl: 3600 });

// कैश प्राप्त करें
const value = await cache.get('key');
```

### del / reset

```ts
// सिंगल key डिलीट करें
await cache.del('key');

// सभी कैश क्लियर करें
await cache.reset();
```

### wrap

`wrap()` मेथड एक बहुत ही उपयोगी टूल है जो पहले कैश से डेटा प्राप्त करने का प्रयास करता है, और यदि कैश मिस होता है, तो फ़ंक्शन को एक्सेक्यूट करता है और परिणाम को कैश में स्टोर करता है।

```ts
const data = await cache.wrap('user:1', async () => {
  // यह फ़ंक्शन केवल कैश मिस होने पर एक्सेक्यूट होता है
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### बैच ऑपरेशंस

```ts
// बैच में सेट करें
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// बैच में प्राप्त करें
const values = await cache.mget(['key1', 'key2', 'key3']);

// बैच में डिलीट करें
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// सभी key प्राप्त करें (ध्यान दें: कुछ स्टोर इसे सपोर्ट नहीं कर सकते हैं)
const allKeys = await cache.keys();

// key का शेष समय-सीमा (सेकंड में) प्राप्त करें
const remainingTTL = await cache.ttl('key');
```

## उन्नत उपयोग

### wrapWithCondition

`wrapWithCondition()` `wrap()` के समान है, लेकिन यह शर्तों के माध्यम से तय कर सकता है कि कैश का उपयोग करना है या नहीं।

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // बाहरी पैरामीटर नियंत्रित करते हैं कि कैश परिणाम का उपयोग करना है या नहीं
    useCache: true, // यदि false पर सेट किया जाता है, तो कैश मौजूद होने पर भी फ़ंक्शन फिर से एक्सेक्यूट होगा

    // डेटा परिणाम के आधार पर तय करें कि कैश करना है या नहीं
    isCacheable: (value) => {
      // उदाहरण के लिए: केवल सफल परिणामों को ही कैश करें
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### ऑब्जेक्ट कैश ऑपरेशंस

जब कैश की गई सामग्री एक ऑब्जेक्ट होती है, तो आप पूरे ऑब्जेक्ट को प्राप्त किए बिना सीधे ऑब्जेक्ट प्रॉपर्टीज़ को ऑपरेट करने के लिए निम्नलिखित मेथड का उपयोग कर सकते हैं।

```ts
// किसी ऑब्जेक्ट की प्रॉपर्टी सेट करें
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// किसी ऑब्जेक्ट की प्रॉपर्टी प्राप्त करें
const name = await cache.getValueInObject('user:1', 'name');

// किसी ऑब्जेक्ट की प्रॉपर्टी डिलीट करें
await cache.delValueInObject('user:1', 'age');
```

## कस्टम स्टोर रजिस्टर करें

यदि आपको अन्य कैश प्रकारों (जैसे Memcached, MongoDB, आदि) का उपयोग करने की आवश्यकता है, तो आप उन्हें `app.cacheManager.registerStore()` के माध्यम से रजिस्टर कर सकते हैं।

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Redis स्टोर रजिस्टर करें (यदि सिस्टम ने इसे रजिस्टर नहीं किया है)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis कनेक्शन कॉन्फ़िगरेशन
      url: 'redis://localhost:6379',
    });

    // नए रजिस्टर किए गए स्टोर का उपयोग करके कैश बनाएं
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## ध्यान देने योग्य बातें

1.  **मेमोरी कैश सीमाएँ**: मेमोरी स्टोर का उपयोग करते समय, मेमोरी ओवरफ़्लो से बचने के लिए उचित `max` पैरामीटर सेट करने पर ध्यान दें।
2.  **कैश अमान्यकरण रणनीति**: डेटा अपडेट करते समय संबंधित कैश को क्लियर करना याद रखें ताकि गलत डेटा से बचा जा सके।
3.  **Key नामकरण परंपराएँ**: `module:resource:id` जैसे सार्थक नेमस्पेस और प्रीफ़िक्स का उपयोग करने की सलाह दी जाती है।
4.  **TTL सेटिंग्स**: प्रदर्शन और निरंतरता को संतुलित करने के लिए डेटा अपडेट आवृत्ति के आधार पर TTL को उचित रूप से सेट करें।
5.  **Redis कनेक्शन**: Redis का उपयोग करते समय, सुनिश्चित करें कि प्रोडक्शन एनवायरनमेंट में कनेक्शन पैरामीटर और पासवर्ड सही ढंग से कॉन्फ़िगर किए गए हैं।