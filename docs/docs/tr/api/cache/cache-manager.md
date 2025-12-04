:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# CacheManager

## Genel Bakış

CacheManager, <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> üzerine kuruludur ve NocoBase için önbellek (cache) modülü yönetimini sağlar. Dahili önbellek türleri şunlardır:

- memory - node-cache-manager tarafından varsayılan olarak sağlanan lru-cache
- redis - node-cache-manager-redis-yet tarafından desteklenir

API aracılığıyla daha fazla tür kaydedilebilir ve genişletilebilir.

### Kavramlar

- **Store**: Bir önbellekleme yöntemini tanımlar. Bu tanım, önbellek oluşturmak için bir fabrika yöntemi ve diğer ilgili yapılandırmaları içerir. Her önbellekleme yönteminin, kayıt sırasında sağlanan benzersiz bir tanımlayıcısı vardır. Dahili iki önbellekleme yönteminin benzersiz tanımlayıcıları `memory` ve `redis`'tir.

- **Store Fabrika Yöntemi**: `node-cache-manager` ve ilgili eklenti paketleri tarafından önbellek oluşturmak için sağlanan bir yöntemdir. Örneğin, `node-cache-manager` tarafından varsayılan olarak sağlanan `'memory'` ve `node-cache-manager-redis-yet` tarafından sağlanan `redisStore` gibi. Bu, `node-cache-manager`'ın `caching` yönteminin ilk parametresine karşılık gelir.

- **Cache**: NocoBase tarafından kapsüllenmiş, önbelleği kullanmak için ilgili yöntemleri sağlayan bir sınıftır. Önbelleği fiilen kullanırken, bir `Cache` örneği üzerinde işlem yaparsınız. Her `Cache` örneğinin, farklı modülleri ayırt etmek için bir ad alanı olarak kullanılabilecek benzersiz bir tanımlayıcısı vardır.

## Sınıf Yöntemleri

### `constructor()`

#### İmza

- `constructor(options?: CacheManagerOptions)`

#### Türler

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

#### Detaylar

##### CacheManagerOptions

| Özellik        | Tür                            | Açıklama                                                                                                                                                                                                                              |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultStore` | `string`                       | Varsayılan önbellek türü için benzersiz tanımlayıcı.                                                                                                                                                                                   |
| `stores`       | `Record<string, StoreOptions>` | Önbellek türlerini kaydeder. Anahtar, önbellek türü için benzersiz tanımlayıcıdır ve değer, önbellek türünün kayıt yöntemini ve genel yapılandırmasını içeren bir nesnedir.<br />`node-cache-manager`'da önbellek oluşturma yöntemi `await caching(store, config)` şeklindedir. Burada sağlanacak nesne [`StoreOptions`](#storeoptions) olacaktır. |

##### StoreOptions

| Özellik         | Tür                                    | Açıklama                                                                                                                                                                                               |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store`         | `memory` \| `FactoryStore<Store, any>` | `caching` yönteminin ilk parametresine karşılık gelen store fabrika yöntemi.                                                                                                                         |
| `close`         | `(store: Store) => Promise<void>`      | İsteğe bağlıdır. Redis gibi bağlantı gerektiren ara yazılımlar için, bağlantıyı kapatmak üzere bir geri çağırma yöntemi sağlanmalıdır. Giriş parametresi, store fabrika yönteminin döndürdüğü nesnedir. |
| `[key: string]` | `any`                                  | `caching` yönteminin ikinci parametresine karşılık gelen diğer genel store yapılandırmaları.                                                                                                           |

#### Varsayılan `options`

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

`options` parametresi, varsayılan seçeneklerle birleştirilecektir. Varsayılan seçeneklerde zaten bulunan özellikler atlanabilir. Örneğin:

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

Yeni bir önbellekleme yöntemi kaydeder. Örneğin:

```ts
import { redisStore } from 'cache-manager-redis-yet';

cacheManager.registerStore({
  // store için benzersiz tanımlayıcı
  name: 'redis',
  // store oluşturmak için fabrika yöntemi
  store: redisStore,
  // store bağlantısını kapat
  close: async (redis: RedisStore) => {
    await redis.client.quit();
  },
  // genel yapılandırma
  url: 'xxx',
});
```

#### İmza

- `registerStore(options: { name: string } & StoreOptions)`

### `createCache()`

Bir önbellek oluşturur. Örneğin:

```ts
await cacheManager.createCache({
  name: 'default', // önbellek için benzersiz tanımlayıcı
  store: 'memory', // store için benzersiz tanımlayıcı
  prefix: 'mycache', // önbellek anahtarlarına otomatik olarak 'mycache:' öneki ekler, isteğe bağlı
  // diğer store yapılandırmaları, özel yapılandırmalar genel store yapılandırmasıyla birleştirilecektir
  max: 2000,
});
```

#### İmza

- `createCache(options: { name: string; prefix?: string; store?: string; [key: string]: any }): Promise<Cache>`

#### Detaylar

##### options

| Özellik         | Tür      | Açıklama                                              |
| --------------- | -------- | ----------------------------------------------------- |
| `name`          | `string` | Önbellek için benzersiz tanımlayıcı.                  |
| `store`         | `string` | Store için benzersiz tanımlayıcı.                     |
| `prefix`        | `string` | İsteğe bağlı, önbellek anahtarı öneki.                |
| `[key: string]` | `any`    | Store ile ilgili diğer özel yapılandırma öğeleri.     |

`store` atlanırsa, `defaultStore` kullanılacaktır. Bu durumda, önbellekleme yöntemi sistemin varsayılan önbellekleme yöntemine göre değişecektir.

Özel yapılandırma olmadığında, genel yapılandırma tarafından oluşturulan ve mevcut önbellekleme yöntemi tarafından paylaşılan varsayılan önbellek alanı döndürülür. Anahtar çakışmalarını önlemek için bir `prefix` eklemeniz önerilir.

```ts
// Varsayılan önbelleği genel yapılandırma ile kullanın
await cacheManager.createCache({ name: 'default', prefix: 'mycache' });
```

##### Cache

[Cache](./cache.md) bölümüne bakın

### `getCache()`

İlgili önbelleği alır.

```ts
cacheManager.getCache('default');
```

#### İmza

- `getCache(name: string): Cache`

### `flushAll()`

Tüm önbellekleri sıfırlar.

```ts
await cacheManager.flushAll();
```

### `close()`

Tüm önbellek ara yazılımı bağlantılarını kapatır.

```ts
await cacheManager.close();
```