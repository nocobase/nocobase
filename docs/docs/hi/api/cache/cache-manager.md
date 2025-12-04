:::tip
यह दस्तावेज़ AI द्वारा अनुवादित किया गया है। किसी भी अशुद्धि के लिए, कृपया [अंग्रेजी संस्करण](/en) देखें
:::

# कैशमैनेजर

## अवलोकन

कैशमैनेजर <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> पर आधारित है और NocoBase के लिए कैश मॉड्यूल प्रबंधन क्षमताएँ प्रदान करता है। इसमें निर्मित कैश प्रकार हैं:

-   memory - `node-cache-manager` द्वारा डिफ़ॉल्ट रूप से प्रदान किया गया lru-cache
-   redis - `node-cache-manager-redis-yet` द्वारा समर्थित

और भी प्रकार API के माध्यम से रजिस्टर और विस्तारित किए जा सकते हैं।

### अवधारणाएँ

-   **Store**: एक कैशिंग विधि को परिभाषित करता है, जिसमें कैश बनाने के लिए एक फ़ैक्टरी विधि और अन्य संबंधित कॉन्फ़िगरेशन भी शामिल हैं। प्रत्येक कैशिंग विधि का एक अद्वितीय पहचानकर्ता होता है जो पंजीकरण के दौरान प्रदान किया जाता है। दो निर्मित कैशिंग विधियों के लिए अद्वितीय पहचानकर्ता `memory` और `redis` हैं।

-   **Store फ़ैक्टरी विधि**: एक विधि जो `node-cache-manager` और संबंधित एक्सटेंशन पैकेजों द्वारा कैश बनाने के लिए प्रदान की जाती है। उदाहरण के लिए, `node-cache-manager` द्वारा डिफ़ॉल्ट रूप से प्रदान किया गया `'memory'`, और `node-cache-manager-redis-yet` द्वारा प्रदान किया गया `redisStore`। यह `node-cache-manager` में `caching` विधि के पहले पैरामीटर से मेल खाती है।

-   **Cache**: NocoBase द्वारा इनकैप्सुलेट की गई एक क्लास जो कैश का उपयोग करने के लिए विधियाँ प्रदान करती है। जब आप वास्तव में कैश का उपयोग करते हैं, तो आप `Cache` के एक इंस्टेंस पर काम करते हैं। प्रत्येक `Cache` इंस्टेंस का एक अद्वितीय पहचानकर्ता होता है, जिसे विभिन्न मॉड्यूलों को अलग करने के लिए एक नेमस्पेस के रूप में उपयोग किया जा सकता है।

## क्लास विधियाँ

### `constructor()`

#### सिग्नेचर

-   `constructor(options?: CacheManagerOptions)`

#### प्रकार

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

#### विवरण

##### CacheManagerOptions

| गुण           | प्रकार                           | विवरण                                                                                                                                                                                                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | डिफ़ॉल्ट कैश प्रकार के लिए अद्वितीय पहचानकर्ता।                                                                                                                                                                                          |
| `stores`       | `Record<string, StoreOptions>` | कैश प्रकारों को रजिस्टर करता है। कुंजी कैश प्रकार के लिए अद्वितीय पहचानकर्ता है, और मान एक ऑब्जेक्ट है जिसमें कैश प्रकार के लिए पंजीकरण विधि और वैश्विक कॉन्फ़िगरेशन शामिल है।<br />`node-cache-manager` में, कैश बनाने की विधि `await caching(store, config)` है। यहाँ प्रदान किया जाने वाला ऑब्जेक्ट [`StoreOptions`](#storeoptions) है। |

##### StoreOptions

| गुण            | प्रकार                                   | विवरण                                                                                                                                                                                            |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | स्टोर फ़ैक्टरी विधि, जो `caching` के पहले पैरामीटर से मेल खाती है।                                                                                                                                       |
| `close`         | `(store: Store) => Promise<void>`      | वैकल्पिक। Redis जैसे मिडलवेयर के लिए जिसे कनेक्शन की आवश्यकता होती है, कनेक्शन बंद करने के लिए एक कॉलबैक विधि प्रदान की जानी चाहिए। इनपुट पैरामीटर स्टोर फ़ैक्टरी विधि द्वारा लौटाया गया ऑब्जेक्ट है। |
| `[key: string]` | `any`                                  | अन्य वैश्विक स्टोर कॉन्फ़िगरेशन, जो `caching` के दूसरे पैरामीटर से मेल खाते हैं।                                                                                                                        |

#### डिफ़ॉल्ट `options`

```ts
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

const defaultOptions: CacheManagerOptions = {
  defaultStore: 'memory',
  stores: {
    memory: {
      store: 'memory',
      // वैश्विक कॉन्फ़िगरेशन
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

`options` पैरामीटर को डिफ़ॉल्ट विकल्पों के साथ मर्ज किया जाएगा। डिफ़ॉल्ट विकल्पों में पहले से मौजूद प्रॉपर्टीज़ को छोड़ा जा सकता है। उदाहरण के लिए:

```ts
const cacheManager = new CacheManager({
  stores: {
    defaultStore: 'redis',
    redis: {
      // redisStore पहले से ही डिफ़ॉल्ट विकल्पों में प्रदान किया गया है, इसलिए आपको केवल redisStore कॉन्फ़िगरेशन प्रदान करने की आवश्यकता है।
      url: 'redis://localhost:6379',
    },
  },
});
```

### `registerStore()`

एक नई कैशिंग विधि रजिस्टर करता है। उदाहरण के लिए:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // स्टोर के लिए अद्वितीय पहचानकर्ता
  name: 'redis',
  // स्टोर बनाने के लिए फ़ैक्टरी विधि
  store: redisStore,
  // स्टोर कनेक्शन बंद करें
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // वैश्विक कॉन्फ़िगरेशन
  url: 'xxx',
});
```

#### सिग्नेचर

-   `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

एक कैश बनाता है। उदाहरण के लिए:

```ts
await cacheManager.createCache({
  name: 'default', // कैश के लिए अद्वितीय पहचानकर्ता
  store: 'memory', // स्टोर के लिए अद्वितीय पहचानकर्ता
  prefix: 'mycache', // कैश कुंजियों में स्वचालित रूप से 'mycache:' उपसर्ग जोड़ता है, वैकल्पिक
  // अन्य स्टोर कॉन्फ़िगरेशन, कस्टम कॉन्फ़िगरेशन को वैश्विक स्टोर कॉन्फ़िगरेशन के साथ मर्ज किया जाएगा
  max: 2000,
});
```

#### सिग्नेचर

-   `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### विवरण

##### options

| गुण            | प्रकार     | विवरण                                           |
| --------------- | -------- | ----------------------------------------------- |
| `name`          | `string` | कैश के लिए अद्वितीय पहचानकर्ता।                 |
| `store`         | `string` | स्टोर के लिए अद्वितीय पहचानकर्ता।                 |
| `prefix`        | `string` | वैकल्पिक, कैश कुंजी उपसर्ग।                     |
| `[key: string]` | `any`    | स्टोर से संबंधित अन्य कस्टम कॉन्फ़िगरेशन आइटम। |

यदि `store` को छोड़ा जाता है, तो `defaultStore` का उपयोग किया जाएगा। इस स्थिति में, कैशिंग विधि सिस्टम की डिफ़ॉल्ट कैशिंग विधि के अनुसार बदल जाएगी।

जब कोई कस्टम कॉन्फ़िगरेशन नहीं होता है, तो यह वैश्विक कॉन्फ़िगरेशन द्वारा बनाया गया और वर्तमान कैशिंग विधि द्वारा साझा किया गया डिफ़ॉल्ट कैश स्पेस लौटाता है। कुंजी संघर्षों से बचने के लिए `prefix` जोड़ने की सलाह दी जाती है।

```ts
// वैश्विक कॉन्फ़िगरेशन के साथ डिफ़ॉल्ट कैश का उपयोग करें
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

[Cache](./cache.md) देखें

### `getCache()`

संबंधित कैश प्राप्त करता है।

```ts
cacheManager.getCache('default');
```

#### सिग्नेचर

-   `getCache(name: string): Cache`

### `flushAll()`

सभी कैश को रीसेट करता है।

```ts
await cacheManager.flushAll();
```

### `close()`

सभी कैश मिडलवेयर कनेक्शन बंद करता है।

```ts
await cacheManager.close();
```