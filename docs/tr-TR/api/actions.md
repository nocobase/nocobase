# Yerleşik ortak kaynak işlemleri

NocoBase, CRUD gibi yaygın olarak kullanılan veri kaynaklarının işlemleri için yerleşik  işlem yöntemlerine sahiptir ve ilgili işlemleri veri tablosu kaynakları aracılığıyla otomatik olarak eşler.

Tüm işlem yöntemleri, kaynak sağlayıcı örneğine kaydedilir ve ayrıca standart Koa uyumlu ara yazılım işlevleridir (`(ctx, next) => Promise<void>`). Eylemin parametreleri, rota tarafından ayrıştırılır ve 'ctx.action' nesnesine eklenir ve sonraki parametre açıklamaları bu nesneyi temel alır.

Genellikle, yerleşik eylem yöntemini doğrudan çağırmaya gerek yoktur.Varsayılan eylem davranışını genişletmeniz gerektiğinde, özel eylem yönteminde varsayılan yöntemi çağırabilirsiniz.

## Paket yapısı

İlişkili varlıklar aşağıdaki şekillerde tanıtılabilir:

```ts
import actions from '@nocobase/actions';
```

## Tek Veri Kaynağı İşlemi

### `list()`

Bir veri listesi alınması işlemine karşılık gelen URL `GET /api/<resource>:list` şeklindedir.

**参数**

| parametre adı | tür | varsayılan değer | açıklama |
| --- | --- | --- | --- |
| `filter` | `Filter` | - | filtre parametresi |
| `fields` | `string[]` | - | Çekilecek alanlar |
| `except` | `string[]` | - | Çekilmeyecek alanlar |
| `appends` | `string[]` | - | İlişkisel alanlar |
| `sort` | `string[]` | - | Sıralama |
| `page` | `number` | 1 | Sayfalandırma |
| `pageSize` | `number` | 20 | Sayfa başına veri sayısı |

**Örnek**

Bir veri listesini sorgulamak için bir arabirim sağlamanız gerektiğinde fakat varsayılan olarak JSON biçiminde çıktı almadığınızda, onu yerleşik varsayılan yönteme göre genişletebilirsiniz:

```ts
import actions from '@nocobase/actions';

app.actions({
  async ['books:list'](ctx, next) {
    ctx.action.mergeParams({
      except: ['content']
    });

    await actions.list(ctx, async () => {
      const { rows } = ctx.body;
      // JSON'u CSV çıktısına dönüştürün
      ctx.body = rows.map(row => Object.keys(row).map(key => row[key]).join(',')).join('\n');
      ctx.type = 'text/csv';

      await next();
    });
  }
});
```

İstek örneği, CSV biçimindeki dosyanın dönüşünü alacaktır:

```shell
curl -X GET http://localhost:13000/api/books:list
```

### `get()`

Tek bir veri parçası almak için işlem URL'si `GET /api/<resource>:get` şeklindedir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
| --- | --- | --- | --- |
| `filterByTk` | `number \| string` | - | birincil anahtarı filtrele |
| `filter` | `Filter` | - | filtre parametresi |
| `fields` | `string[]` | - | Çekilecek alanlar |
| `except` | `string[]` | - | Çekilmeyecek alanlar |
| `appends` | `string[]` | - | İlişkisel alanlar |
| `sort` | `string[]` | - | Sıralama |
| `page` | `number` | 1 | Sayfalandırma |
| `pageSize` | `number` | 20 | Sayfa başı veri sayısı |

**Örnek**

NocoBase'in yerleşik dosya yönetimi eklentisine dayanarak, istemci kaynak tanımlayıcılı bir dosya indirmeyi istediğinde dosya akışını döndürecek şekilde genişletilebilir:

```ts
import path from 'path';
import actions from '@nocobase/actions';
import { STORAGE_TYPE_LOCAL } from '@nocobase/plugin-file-manager';

app.actions({
  async ['attachments:get'](ctx, next) {
    ctx.action.mergeParams({
      appends: ['storage'],
    });

    await actions.get(ctx, async () => {
      if (ctx.accepts('json', 'application/octet-stream') === 'json') {
        return next();
      }

      const { body: attachment } = ctx;
      const { storage } = attachment;

      if (storage.type !== STORAGE_TYPE_LOCAL) {
        return ctx.redirect(attachment.url);
      }

      ctx.body = fs.createReadStream(path.resolve(storage.options.documentRoot?, storage.path));
      ctx.attachment(attachment.filename);
      ctx.type = 'application/octet-stream';

      await next();
    });
  }
});
```

İstek örneği, dosya akışının dönüşünü alacak：

```shell
curl -X GET -H "Accept: application/octet-stream" http://localhost:13000/api/attachments:get?filterByTk=1
```

### `create()`

Tek bir veri parçası oluşturma işleminin URL'si "POST /api/<resource>:create" şeklindedir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
| --- | --- | --- | --- |
| `values` | `Object` | - | oluşturulacak veriler |

**Örnek**

Dosya yönetimi eklentisine benzer şekilde, yüklenen dosyaya ek olarak ikili içerikli veri oluşturma:

```ts
import multer from '@koa/multer';
import actions from '@nocobase/actions';

app.actions({
  async ['files:create'](ctx, next) {
    if (ctx.request.type === 'application/json') {
      return actions.create(ctx, next);
    }

    if (ctx.request.type !== 'multipart/form-data') {
      return ctx.throw(406);
    }

    // Dosya kaydetme işlemi yalnızca örnek olarak multer() kullanır ve tam mantığı temsil etmez
    multer().single('file')(ctx, async () => {
      const { file, body } = ctx.request;
      const { filename, mimetype, size, path } = file;

      ctx.action.mergeParams({
        values: {
          filename,
          mimetype,
          size,
          path: file.path,
          meta: typeof body.meta === 'string' ? JSON.parse(body.meta) : {};
        }
      });

      await actions.create(ctx, next);
    });
  }
});
```

İstek örneği; dosya tablosunda sıradan veriler oluşturabilir veya eklerle birlikte gönderebilirsiniz:

```shell
# Yalnızca normal veriler oluşturun
curl -X POST -H "Content-Type: application/json" -d '{"filename": "some-file.txt", "mimetype": "text/plain", "size": 5, "url": "https://cdn.yourdomain.com/some-file.txt"}' "http://localhost:13000/api/files:create"

# Eklerle birlikte gönder
curl -X POST -F "file=@/path/to/some-file.txt" -F 'meta={"length": 100}' "http://localhost:13000/api/files:create"
```

### `update()`

Bir veya daha fazla veri parçasını güncellemek için kullanılan URL, "PUT /api/<resource>:update" şeklindedir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
| --- | --- | --- | --- |
| `filter` | `Filter` | - | filtre parametresi |
| `filterByTk` | `number \| string` | - | birincil anahtarı filtrele |
| `values` | `Object` | - | güncellenecek veri değeri |

Not: parametrelerdeki `filter` ve `filterByTk` en az bir öğe sağlar.

**Örnek**

"create()" örneğine benzer şekilde, güncellenmiş dosya olarak ikili içerik verilerini taşımak için de kullanılabilir.

```ts
import multer from '@koa/multer';
import actions from '@nocobase/actions';

app.actions({
  async ['files:update'](ctx, next) {
    if (ctx.request.type === 'application/json') {
      return actions.update(ctx, next);
    }

    if (ctx.request.type !== 'multipart/form-data') {
      return ctx.throw(406);
    }

    // Dosya kaydetme işlemi yalnızca örnek olarak multer() kullanır ve tam mantığı temsil etmez
    multer().single('file')(ctx, async () => {
      const { file, body } = ctx.request;
      const { filename, mimetype, size, path } = file;

      ctx.action.mergeParams({
        values: {
          filename,
          mimetype,
          size,
          path: file.path,
          meta: typeof body.meta === 'string' ? JSON.parse(body.meta) : {};
        }
      });

      await actions.update(ctx, next);
    });
  }
});
```

İstek örneği, dosya tablosunda sıradan veriler oluşturabilir veya eklerle birlikte gönderebilirsiniz:

```shell
# Yalnızca normal veriler oluşturun
curl -X PUT -H "Content-Type: application/json" -d '{"filename": "some-file.txt", "mimetype": "text/plain", "size": 5, "url": "https://cdn.yourdomain.com/some-file.txt"}' "http://localhost:13000/api/files:update"

# Eklerle birlikte gönderme
curl -X PUT -F "file=@/path/to/some-file.txt" -F 'meta={"length": 100}' "http://localhost:13000/api/files:update"
```

### `destroy()`

Bir veya daha fazla veri parçasını silin. Karşılık gelen URL "DELETE /api/<resource>:destroy" şeklindedir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
| --- | --- | --- | --- |
| `filter` | `Filter` | - | filtre parametresi |
| `filterByTk` | `number \| string` | - | birincil anahtarı filtrele |

Not: parametrelerdeki `filter` ve `filterByTk` en az bir öğe sağlar.

**Örnek**

Dosya verilerini silmek için bir dosya yönetimi eklentisinin uzantısına benzer şekilde dosyayı da silmek gerekir:

```ts
import actions from '@nocobase/actions';

app.actions({
  async ['files:destroy'](ctx, next) {
    // const repository = getRepositoryFromParams(ctx);

    // const { filterByTk, filter } = ctx.action.params;

    // const items = await repository.find({
    //   fields: [repository.collection.filterTargetKey],
    //   appends: ['storage'],
    //   filter,
    //   filterByTk,
    //   context: ctx,
    // });

    // await items.reduce((promise, item) => promise.then(async () => {
    //   await item.removeFromStorage();
    //   await item.destroy();
    // }), Promise.resolve());

    await actions.destroy(ctx, async () => {
      // yapılacak işler
      await next();
    });
  }
});
```

### `move()`
Karşılık gelen URL 'POST /api/<resource>:move' şeklindedir.

Bu yöntem, verileri taşımak ve verilerin sırasını ayarlamak için kullanılır. Örneğin, bir sayfada bir öğeyi başka bir öğenin üstüne veya altına sürükleyip bırakın, sırayı ayarlamak için de bu yöntemi kullanabilirsiniz.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
|----------|-------------| -- |---------------|
| `sourceId` | `targetKey` | - | Kaynak öğe kimliği       |
| `targetId` | `targetKey` | - | Hedef öğe kimliği |
| `sortField` | `string`    | `sort` | Depolanan alan adını sırala      |
| `targetScope` | `string`    | - |   Sıralanmış kapsam, bir kaynak farklı kapsamlara göre sıralanabilir  |
| `sticky` | `boolean` | - | Hareketli elemanın üstte olup olmadığı |
| `method` | `insertAfter` \| `prepend` | - | Ekleme türü, hedef öğenin eklenmesinden önce veya sonra |

## İlişkisel Kaynak Kaynak İşlemleri

### `add()`

Bir nesneyle ilişki eklemek için, karşılık gelen URL `POST /api/<resource.assocition>:add` şeklindedir. "hasMany" ve "belongsToMany" ilişkilendirmeleri için geçerlidir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
|----------|-------------| --- | --- |
| `values` | `TargetKey \| TargetKey[]` | - | Eklenen ilişkili nesne kimliği |

### `remove()`
Bir nesneyle olan ilişkilendirmeyi kaldırmak için karşılık gelen URL 'POST /api/<resource.assocition>:remove' şeklindedir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
|----------|-------------| --- | --- |
| `values` | `TargetKey \| TargetKey[]` | - | Kaldırılan ilişkili nesne kimliği |

### `set()`
İlişkili ilişkilendirme nesnesini ayarlamaya karşılık gelen URL 'POST /api/<resource.assocition>:set' şeklindedir.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
|----------|-------------| --- | --- |
| `values` | `TargetKey \| TargetKey[]` | - | İlişkili nesnenin kimliğini ayarlayın |

### `toggle()`

İlişkili ilişkilendirme nesnesini değiştirmeye karşılık gelen URL 'POST /api/<resource.assocition>:toggle' şeklindedir. "toggle", ilişkili nesnenin zaten var olup olmadığını dahili olarak belirler, varsa onu kaldırır ve yoksa ekler.

**Parametre**

| parametre adı | tür | varsayılan değer | açıklama |
|----------|-------------| -- | --- |
| `values` | `TargetKey` | - | Anahtarın ilişkili nesnesinin kimliği |
