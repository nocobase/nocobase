:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Cache

NocoBase'in Cache modülü, <a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">node-cache-manager</a> üzerine kuruludur ve eklenti geliştirme için önbellekleme işlevselliği sunar. Sistemde iki yerleşik önbellek türü bulunur:

- **memory** - lru-cache tabanlı bellek önbelleği, node-cache-manager tarafından varsayılan olarak sağlanır.
- **redis** - node-cache-manager-redis-yet tabanlı Redis önbelleği.

Daha fazla önbellek türü API aracılığıyla genişletilebilir ve kaydedilebilir.

## Temel Kullanım

### app.cache

`app.cache`, uygulama düzeyindeki varsayılan önbellek örneğidir ve doğrudan kullanabilirsiniz.

```ts
// Önbelleği ayarla
await app.cache.set('key', 'value', { ttl: 3600 }); // TTL birimi: saniye

// Önbelleği al
const value = await app.cache.get('key');

// Önbelleği sil
await this.app.cache.del('key');
```

### ctx.cache

Ara yazılım veya kaynak işlemlerinde, `ctx.cache` aracılığıyla önbelleğe erişebilirsiniz.

```ts
async (ctx, next) => {
  let data = await ctx.cache.get('custom:data');
  if (!data) {
    // Önbellek isabet etmedi, veritabanından al
    data = await this.getDataFromDatabase();
    // Önbelleğe kaydet, 1 saat geçerli
    await ctx.cache.set('custom:data', data, { ttl: 3600 });
  }
  await next();
}
```

## Özel Önbellek Oluşturma

Bağımsız bir önbellek örneği (örneğin farklı ad alanları veya yapılandırmalar için) oluşturmanız gerekirse, `app.cacheManager.createCache()` yöntemini kullanabilirsiniz.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Önekli bir önbellek örneği oluşturun
    const myCache = await this.app.cacheManager.createCache({
      name: 'myPlugin',
      prefix: 'plugin:cache:', // Tüm anahtarlara bu önek otomatik olarak eklenecektir
      store: 'memory', // Bellek önbelleği kullanın, isteğe bağlıdır, varsayılan olarak defaultStore kullanılır
      max: 1000, // Maksimum önbellek öğesi sayısı
    });

    await myCache.set('user:1', { name: 'John' });
    const user = await myCache.get('user:1');
  }
}
```

### createCache Parametre Açıklamaları

| Parametre | Tür | Açıklama |
| ---- | ---- | ---- |
| `name` | `string` | Önbelleğin benzersiz tanımlayıcısı, zorunludur |
| `prefix` | `string` | İsteğe bağlı, önbellek anahtarları için önek, anahtar çakışmalarını önlemek için kullanılır |
| `store` | `string` | İsteğe bağlı, depolama türü tanımlayıcısı (örn. `'memory'`, `'redis'`), varsayılan olarak `defaultStore` kullanılır |
| `[key: string]` | `any` | Depolama ile ilgili diğer özel yapılandırma öğeleri |

### Oluşturulan Önbelleği Alma

```ts
const myCache = this.app.cacheManager.getCache('myPlugin');
```

## Temel Önbellek Yöntemleri

Cache örnekleri, çoğu node-cache-manager'dan miras alınan zengin önbellek işlem yöntemleri sunar.

### get / set

```ts
// Önbelleği süre sonu ile ayarla (birim: saniye)
await cache.set('key', 'value', { ttl: 3600 });

// Önbelleği al
const value = await cache.get('key');
```

### del / reset

```ts
// Tek bir anahtarı sil
await cache.del('key');

// Tüm önbelleği temizle
await cache.reset();
```

### wrap

`wrap()` yöntemi çok kullanışlı bir araçtır; önce önbellekten veri almaya çalışır, önbellek isabet etmezse işlevi yürütür ve sonucu önbelleğe kaydeder.

```ts
const data = await cache.wrap('user:1', async () => {
  // Bu işlev yalnızca önbellek isabet etmediğinde yürütülür
  return await this.fetchUserFromDatabase(1);
}, { ttl: 3600 });
```

### Toplu İşlemler

```ts
// Toplu ayarla
await cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3'],
], { ttl: 3600 });

// Toplu al
const values = await cache.mget(['key1', 'key2', 'key3']);

// Toplu sil
await cache.mdel(['key1', 'key2', 'key3']);
```

### keys / ttl

```ts
// Tüm anahtarları al (not: bazı depolama türleri bunu desteklemeyebilir)
const allKeys = await cache.keys();

// Anahtarın kalan süre sonu süresini al (birim: saniye)
const remainingTTL = await cache.ttl('key');
```

## Gelişmiş Kullanım

### wrapWithCondition

`wrapWithCondition()`, `wrap()`'a benzer, ancak koşullar aracılığıyla önbelleği kullanıp kullanmayacağınıza karar verebilirsiniz.

```ts
const data = await cache.wrapWithCondition(
  'user:1',
  async () => {
    return await this.fetchUserFromDatabase(1);
  },
  {
    // Harici parametreler önbellek sonucunun kullanılıp kullanılmayacağını kontrol eder
    useCache: true, // Eğer false olarak ayarlanırsa, önbellek olsa bile işlev yeniden yürütülür

    // Veri sonucuna göre önbelleğe alınıp alınmayacağına karar verin
    isCacheable: (value) => {
      // Örneğin: yalnızca başarılı sonuçlar önbelleğe alınır
      return value && !value.error;
    },

    ttl: 3600,
  },
);
```

### Nesne Önbellek İşlemleri

Önbelleğe alınan içerik bir nesne olduğunda, tüm nesneyi almadan nesne özelliklerini doğrudan işlemek için aşağıdaki yöntemleri kullanabilirsiniz.

```ts
// Bir nesnenin bir özelliğini ayarla
await cache.setValueInObject('user:1', 'name', 'John');
await cache.setValueInObject('user:1', 'age', 30);

// Bir nesnenin bir özelliğini al
const name = await cache.getValueInObject('user:1', 'name');

// Bir nesnenin bir özelliğini sil
await cache.delValueInObject('user:1', 'age');
```

## Özel Depolama Kaydetme

Diğer önbellek türlerini (Memcached, MongoDB vb. gibi) kullanmanız gerekirse, bunları `app.cacheManager.registerStore()` aracılığıyla kaydedebilirsiniz.

```ts
import { Plugin } from '@nocobase/server';
import { redisStore, RedisStore } from 'cache-manager-redis-yet';

export default class PluginCacheDemo extends Plugin {
  async load() {
    // Redis depolamasını kaydet (sistem henüz kaydetmediyse)
    this.app.cacheManager.registerStore({
      name: 'redis',
      store: redisStore,
      close: async (redis: RedisStore) => {
        await redis.client.quit();
      },
      // Redis bağlantı yapılandırması
      url: 'redis://localhost:6379',
    });

    // Yeni kaydedilen depolamayı kullanarak önbellek oluştur
    const redisCache = await this.app.createCache({
      name: 'redisCache',
      store: 'redis',
      prefix: 'app:',
    });
  }
}
```

## Dikkat Edilmesi Gerekenler

1.  **Bellek Önbellek Sınırları**: Bellek depolamasını kullanırken, bellek taşmasını önlemek için makul bir `max` parametresi ayarlamaya dikkat edin.
2.  **Önbellek Geçersiz Kılma Stratejisi**: Verileri güncellerken kirli verileri önlemek için ilgili önbelleği temizlemeyi unutmayın.
3.  **Anahtar Adlandırma Kuralları**: `module:resource:id` gibi anlamlı ad alanları ve önekler kullanmanız önerilir.
4.  **TTL Ayarları**: Performans ve tutarlılık arasında denge kurmak için veri güncelleme sıklığına göre TTL'yi makul bir şekilde ayarlayın.
5.  **Redis Bağlantısı**: Redis kullanırken, üretim ortamında bağlantı parametrelerinin ve parolaların doğru yapılandırıldığından emin olun.