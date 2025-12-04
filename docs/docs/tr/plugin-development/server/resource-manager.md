:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# ResourceManager Kaynak Yönetimi

NocoBase'in kaynak yönetimi özelliği, mevcut **koleksiyonları** ve ilişkileri (association) otomatik olarak kaynaklara dönüştürebilir. Bu özellik, geliştiricilerin REST API kaynak işlemlerini hızla oluşturmasına yardımcı olmak için çeşitli yerleşik işlem türleri sunar. Geleneksel REST API'lerinden biraz farklı olarak, NocoBase kaynak işlemleri HTTP istek yöntemlerine doğrudan bağlı değildir; bunun yerine, gerçekleştirilecek belirli işlemi açıkça tanımlanmış `:action` ile belirlersiniz.

## Otomatik Kaynak Oluşturma

NocoBase, veritabanında tanımlanan `koleksiyonları` ve `ilişkileri` otomatik olarak kaynaklara dönüştürür. Örneğin, `posts` ve `tags` olmak üzere iki **koleksiyon** tanımladığınızda:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

Bu durumda aşağıdaki kaynaklar otomatik olarak oluşturulur:

*   `posts` kaynağı
*   `tags` kaynağı
*   `posts.tags` ilişki kaynağı

İstek Örnekleri:

| İstek Yöntemi | Yol                        | İşlem             |
| ------------- | -------------------------- | ----------------- |
| `GET`         | `/api/posts:list`          | Liste Sorgula     |
| `GET`         | `/api/posts:get/1`         | Tek Kayıt Sorgula |
| `POST`        | `/api/posts:create`        | Yeni Ekle         |
| `POST`        | `/api/posts:update/1`      | Güncelle          |
| `POST`        | `/api/posts:destroy/1`     | Sil               |

| İstek Yöntemi | Yol                        | İşlem             |
| ------------- | -------------------------- | ----------------- |
| `GET`         | `/api/tags:list`           | Liste Sorgula     |
| `GET`         | `/api/tags:get/1`          | Tek Kayıt Sorgula |
| `POST`        | `/api/tags:create`         | Yeni Ekle         |
| `POST`        | `/api/tags:update/1`       | Güncelle          |
| `POST`        | `/api/tags:destroy/1`      | Sil               |

| İstek Yöntemi | Yol                                | İşlem                                       |
| ------------- | ---------------------------------- | ------------------------------------------- |
| `GET`         | `/api/posts/1/tags:list`           | Belirli bir `post`'a ait tüm `tags`'leri sorgula |
| `GET`         | `/api/posts/1/tags:get/1`          | Belirli bir `post` altındaki tek bir `tags`'i sorgula |
| `POST`        | `/api/posts/1/tags:create`         | Belirli bir `post` altındaki tek bir `tags`'i oluştur |
| `POST`        | `/api/posts/1/tags:update/1`       | Belirli bir `post` altındaki tek bir `tags`'i güncelle |
| `POST`        | `/api/posts/1/tags:destroy/1`      | Belirli bir `post` altındaki tek bir `tags`'i sil |
| `POST`        | `/api/posts/1/tags:add`            | Belirli bir `post`'a ilişkili `tags`'leri ekle |
| `POST`        | `/api/posts/1/tags:remove`         | Belirli bir `post`'tan ilişkili `tags`'leri kaldır |
| `POST`        | `/api/posts/1/tags:set`            | Belirli bir `post`'a ait tüm ilişkili `tags`'leri ayarla |
| `POST`        | `/api/posts/1/tags:toggle`         | Belirli bir `post`'a ait `tags` ilişkisini değiştir/geçiş yap |

:::tip İpucu

NocoBase kaynak işlemleri doğrudan istek yöntemlerine bağlı değildir; bunun yerine, gerçekleştirilecek işlemi açıkça tanımlanmış `:action` ile belirlersiniz.

:::

## Kaynak İşlemleri

NocoBase, çeşitli iş ihtiyaçlarını karşılamak için zengin yerleşik işlem türleri sunar.

### Temel CRUD İşlemleri

| İşlem Adı        | Açıklama                      | Uygulanabilir Kaynak Türleri | İstek Yöntemi | Örnek Yol                   |
| ---------------- | ----------------------------- | ---------------------------- | ------------- | --------------------------- |
| `list`           | Liste verilerini sorgula      | Tümü                         | GET/POST      | `/api/posts:list`           |
| `get`            | Tek bir kaydı sorgula         | Tümü                         | GET/POST      | `/api/posts:get/1`          |
| `create`         | Yeni kayıt oluştur            | Tümü                         | POST          | `/api/posts:create`         |
| `update`         | Kaydı güncelle                | Tümü                         | POST          | `/api/posts:update/1`       |
| `destroy`        | Kaydı sil                     | Tümü                         | POST          | `/api/posts:destroy/1`      |
| `firstOrCreate`  | İlk kaydı bul, yoksa oluştur  | Tümü                         | POST          | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Kaydı güncelle, yoksa oluştur | Tümü                         | POST          | `/api/users:updateOrCreate` |

### İlişki İşlemleri

| İşlem Adı | Açıklama              | Uygulanabilir İlişki Türleri                      | Örnek Yol                      |
| --------- | --------------------- | ------------------------------------------------- | ------------------------------ |
| `add`     | İlişki ekle           | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`  | İlişkiyi kaldır       | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`     | İlişkiyi sıfırla      | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`  | İlişki ekle veya kaldır | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### İşlem Parametreleri

Yaygın işlem parametreleri şunları içerir:

*   `filter`: Sorgu koşulları
*   `values`: Ayarlanacak değerler
*   `fields`: Döndürülecek alanları belirtir
*   `appends`: İlişkili verileri dahil eder
*   `except`: Alanları hariç tutar
*   `sort`: Sıralama kuralları
*   `page`, `pageSize`: Sayfalama parametreleri
*   `paginate`: Sayfalamanın etkinleştirilip etkinleştirilmeyeceği
*   `tree`: Ağaç yapısı döndürülüp döndürülmeyeceği
*   `whitelist`, `blacklist`: Alan beyaz listesi/kara listesi
*   `updateAssociationValues`: İlişki değerlerinin güncellenip güncellenmeyeceği

---

## Özel Kaynak İşlemleri

NocoBase, mevcut kaynaklar için ek işlemler kaydetmenize olanak tanır. Tüm kaynaklar veya belirli kaynaklar için işlemleri özelleştirmek üzere `registerActionHandlers` kullanabilirsiniz.

### Genel İşlemleri Kaydetme

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Belirli Kaynaklara Özgü İşlemleri Kaydetme

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

İstek Örnekleri:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Adlandırma kuralı: `resourceName:actionName`. İlişkiler dahil edildiğinde nokta sözdizimi (`posts.comments`) kullanılır.

## Özel Kaynaklar

**Koleksiyonlarla** ilişkili olmayan kaynaklar sağlamanız gerektiğinde, bunları `resourceManager.define` yöntemini kullanarak tanımlayabilirsiniz:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

İstek yöntemleri, otomatik olarak oluşturulan kaynaklarla tutarlıdır:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (varsayılan olarak hem GET hem de POST'u destekler)

## Özel Ara Katman Yazılımları (Middleware)

`resourceManager.use()` yöntemini kullanarak genel ara katman yazılımlarını kaydedebilirsiniz. Örneğin:

Genel günlükleme ara katman yazılımı

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Özel Bağlam (Context) Özellikleri

`resourceManager` katmanının ara katman yazılımına veya işlemine girebilmek, bu kaynağın mutlaka var olduğu anlamına gelir.

### ctx.action

*   `ctx.action.actionName`: İşlem adı
*   `ctx.action.resourceName`: Bir **koleksiyon** veya ilişki (association) olabilir
*   `ctx.action.params`: İşlem parametreleri

### ctx.dataSource

Mevcut **veri kaynağı** nesnesi.

### ctx.getCurrentRepository()

Mevcut repository nesnesi.

## Farklı Veri Kaynaklarının ResourceManager Nesneleri Nasıl Alınır?

`resourceManager` bir **veri kaynağına** aittir ve farklı **veri kaynakları** için ayrı ayrı işlemler kaydedebilirsiniz.

### Ana Veri Kaynağı

Ana **veri kaynağı** için doğrudan `app.resourceManager` kullanabilirsiniz:

```ts
app.resourceManager.registerActionHandlers();
```

### Diğer Veri Kaynakları

Diğer **veri kaynakları** için, `dataSourceManager` aracılığıyla belirli bir **veri kaynağı** örneğini alabilir ve bu örneğin `resourceManager`'ını kullanarak işlem yapabilirsiniz:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Tüm Veri Kaynaklarını Yineleme

Eklenen tüm **veri kaynakları** üzerinde aynı işlemleri gerçekleştirmeniz gerekiyorsa, her **veri kaynağının** `resourceManager`'ının ilgili işlemleri kaydedebildiğinden emin olmak için `dataSourceManager.afterAddDataSource` yöntemini kullanarak yineleme yapabilirsiniz:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```