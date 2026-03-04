:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/get-var) bakın.
:::

# ctx.getVar()

Mevcut çalışma zamanı bağlamından (runtime context) değişken değerlerini **asenkron** olarak okur. Değişken çözünürlüğü, SQL ve şablonlardaki `{{ctx.xxx}}` ile tutarlıdır; genellikle mevcut kullanıcı, mevcut kayıt, görünüm parametreleri, açılır pencere (popup) bağlamı vb. kaynaklardan gelir.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField** | İşleme (rendering) veya mantıksal kararlar için mevcut kayıt, kullanıcı, kaynak vb. hakkında bilgi alın. |
| **Bağlantı Kuralları / İş Akışı (FlowEngine)** | Koşullu mantık yürütmek için `ctx.record`, `ctx.formValues` vb. değerleri okuyun. |
| **Formüller / Şablonlar** | `{{ctx.xxx}}` ile aynı değişken çözümleme kurallarını kullanır. |

## Tür Tanımı

```ts
getVar(path: string): Promise<any>;
```

| Parametre | Tür | Açıklama |
|------|------|------|
| `path` | `string` | Değişken yolu; **`ctx.` ile başlamalıdır**. Nokta notasyonu ve dizi indekslerini destekler. |

**Dönüş Değeri**: `Promise<any>`. Çözümlenen değeri almak için `await` kullanın; değişken mevcut değilse `undefined` döner.

> Eğer `ctx.` ile başlamayan bir yol geçilirse hata fırlatılır: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Yaygın Değişken Yolları

| Yol | Açıklama |
|------|------|
| `ctx.record` | Mevcut kayıt (bir form/detay bloğu bir kayda bağlı olduğunda kullanılabilir) |
| `ctx.record.id` | Mevcut kaydın birincil anahtarı (ID) |
| `ctx.formValues` | Mevcut form değerleri (bağlantı kurallarında ve iş akışlarında yaygın kullanılır; form senaryolarında gerçek zamanlı okuma için `ctx.form.getFieldsValue()` tercih edilir) |
| `ctx.user` | Mevcut giriş yapmış kullanıcı |
| `ctx.user.id` | Mevcut kullanıcı ID'si |
| `ctx.user.nickname` | Mevcut kullanıcı takma adı |
| `ctx.user.roles.name` | Mevcut kullanıcı rol adları (dizi) |
| `ctx.popup.record` | Açılır pencere (popup) içindeki kayıt |
| `ctx.popup.record.id` | Açılır pencere içindeki kaydın birincil anahtarı |
| `ctx.urlSearchParams` | URL sorgu parametreleri (`?key=value` yapısından çözümlenir) |
| `ctx.token` | Mevcut API Token'ı |
| `ctx.role` | Mevcut rol |

## ctx.getVarInfos()

Mevcut bağlamdaki çözümlenebilir değişkenlerin **yapısal bilgilerini** (tür, başlık, alt özellikler vb.) alarak kullanılabilir yolların keşfedilmesini kolaylaştırır. Dönüş değeri `meta` tabanlı statik bir açıklamadır ve gerçek çalışma zamanı değerlerini içermez.

### Tür Tanımı

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Dönüş değerindeki her bir anahtar (key) bir değişken yoludur ve değer (value), o yolun yapısal bilgisidir (`type`, `title`, `properties` vb. içerir).

### Parametreler

| Parametre | Tür | Açıklama |
|------|------|------|
| `path` | `string \| string[]` | Kırpma yolu; yalnızca bu yol altındaki değişken yapısını toplar. `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'` desteklenir; dizi kullanımı birden fazla yolun birleştirilmesini sağlar. |
| `maxDepth` | `number` | Maksimum genişleme derinliği, varsayılan `3`. `path` sağlanmadığında üst düzey özelliklerin derinliği `depth=1` olur. `path` sağlandığında, yola karşılık gelen düğümün derinliği `depth=1` olur. |

### Örnek

```ts
// record altındaki değişken yapısını al (en fazla 3 seviye)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// popup.record yapısını al
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Tüm üst düzey değişken yapısını al (varsayılan maxDepth=3)
const vars = await ctx.getVarInfos();
```

## ctx.getValue ile Farkı

| Yöntem | Senaryo | Açıklama |
|------|----------|------|
| `ctx.getValue()` | JSField veya JSItem gibi düzenlenebilir alanlar | **Mevcut alanın** değerini senkronize olarak alır; form bağlaması gerektirir. |
| `ctx.getVar(path)` | Herhangi bir RunJS bağlamı | **Herhangi bir ctx değişkenini** asenkron olarak alır; yol `ctx.` ile başlamalıdır. |

Bir JSField içinde, mevcut alanı okumak/yazmak için `getValue`/`setValue` kullanın; diğer bağlam değişkenlerine (`record`, `user`, `formValues` gibi) erişmek için `getVar` kullanın.

## Dikkat Edilmesi Gerekenler

- **Yol `ctx.` ile başlamalıdır**: Örneğin `ctx.record.id`, aksi takdirde hata fırlatılır.
- **Asenkron yöntem**: Sonucu almak için mutlaka `await` kullanmalısınız, örn. `const id = await ctx.getVar('ctx.record.id')`.
- **Değişken mevcut değilse**: `undefined` döner. Varsayılan bir değer atamak için sonuçtan sonra `??` kullanabilirsiniz: `(await ctx.getVar('ctx.user.nickname')) ?? 'Misafir'`.
- **Form değerleri**: `ctx.formValues`, `await ctx.getVar('ctx.formValues')` aracılığıyla alınmalıdır; doğrudan `ctx.formValues` olarak sunulmaz. Form bağlamında, en güncel değerleri gerçek zamanlı okumak için `ctx.form.getFieldsValue()` kullanılması tercih edilir.

## Örnekler

### Mevcut Kayıt ID'sini Al

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Mevcut kayıt: ${recordId}`);
}
```

### Açılır Pencere İçindeki Kaydı Al

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Mevcut açılır pencere kaydı: ${recordId}`);
}
```

### Bir Dizi Alanının Alt Öğelerini Oku

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Rol adlarından oluşan bir dizi döner, örn. ['admin', 'member']
```

### Varsayılan Değer Atama

```ts
// getVar yönteminin defaultValue parametresi yoktur; sonuçtan sonra ?? kullanın
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Misafir';
```

### Form Alan Değerlerini Oku

```ts
// Hem ctx.formValues hem de ctx.form, form senaryoları içindir; iç içe alanları okumak için getVar kullanın
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### URL Sorgu Parametrelerini Oku

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // ?id=xxx parametresine karşılık gelir
```

### Kullanılabilir Değişkenleri Keşfet

```ts
// record altındaki değişken yapısını al (en fazla 3 seviye)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars şuna benzer: { 'record.id': { type: 'string', title: 'id' }, ... }
```

## İlgili Sayfalar

- [ctx.getValue()](./get-value.md) - Mevcut alan değerini senkronize olarak alır (yalnızca JSField/JSItem)
- [ctx.form](./form.md) - Form örneği; `ctx.form.getFieldsValue()` form değerlerini gerçek zamanlı okuyabilir
- [ctx.model](./model.md) - Mevcut yürütme bağlamının bulunduğu model
- [ctx.blockModel](./block-model.md) - Mevcut JS'nin bulunduğu üst blok
- [ctx.resource](./resource.md) - Mevcut bağlamdaki kaynak (resource) örneği
- SQL / Şablonlardaki `{{ctx.xxx}}` - `ctx.getVar('ctx.xxx')` ile aynı çözümleme kurallarını kullanır.