:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/resource/multi-record-resource) bakın.
:::

# MultiRecordResource

Veri tablolarına yönelik Kaynak (Resource): İstekler bir dizi döndürür; sayfalama, filtreleme, sıralama ve CRUD işlemlerini destekler. Tablolar ve listeler gibi "çoklu kayıt" senaryoları için uygundur. [APIResource](./api-resource.md)'dan farklı olarak, MultiRecordResource `setResourceName()` aracılığıyla kaynak adını belirtir, otomatik olarak `users:list`, `users:create` gibi URL'ler oluşturur ve yerleşik sayfalama, filtreleme, satır seçme gibi yeteneklere sahiptir.

**Kalıtım**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Oluşturma yöntemi**: `ctx.makeResource('MultiRecordResource')` veya `ctx.initResource('MultiRecordResource')`. Kullanmadan önce `setResourceName('koleksiyon_adı')` (örneğin `'users'`) çağrılmalıdır; RunJS içinde `ctx.api` çalışma ortamı tarafından enjekte edilir.

---

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Tablo Blokları** | Tablo ve liste blokları varsayılan olarak MultiRecordResource kullanır; sayfalama, filtreleme ve sıralamayı destekler. |
| **JSBlock Listeleri** | JSBlock içinde kullanıcılar, siparişler gibi koleksiyon verilerini yükleyin ve özel işleme (rendering) yapın. |
| **Toplu İşlemler** | Seçili satırları almak için `getSelectedRows()`, toplu silme için `destroySelectedRows()` kullanın. |
| **İlişkili Kaynaklar** | `users.tags` gibi formatlar kullanarak ilişkili koleksiyonları yükleyin; `setSourceId(üst_kayıt_id)` ile birlikte kullanılmalıdır. |

---

## Veri Formatı

- `getData()` bir **kayıt dizisi** döndürür, yani liste API yanıtındaki `data` alanıdır.
- `getMeta()` sayfalama ve diğer meta verileri döndürür: `page`, `pageSize`, `count`, `totalPage` vb.

---

## Kaynak Adı ve Veri Kaynağı

| Yöntem | Açıklama |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Kaynak adı, örn. `'users'`, `'users.tags'` (ilişkili kaynak). |
| `setSourceId(id)` / `getSourceId()` | İlişkili kaynaklar için üst kayıt ID'si (örn. `users.tags` için kullanıcının birincil anahtarını iletin). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Veri kaynağı tanımlayıcısı (çoklu veri kaynağı senaryolarında kullanılır). |

---

## İstek Parametreleri (Filtre / Alanlar / Sıralama)

| Yöntem | Açıklama |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Birincil anahtara göre filtreleme (tekli kayıt `get` vb. için). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Filtreleme koşulları; `$eq`, `$ne`, `$in` gibi operatörleri destekler. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Filtre grupları (birden fazla koşulu birleştirmek için). |
| `setFields(fields)` / `getFields()` | İstenen alanlar (beyaz liste). |
| `setSort(sort)` / `getSort()` | Sıralama, örn. oluşturma zamanına göre azalan sırada `['-createdAt']`. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | İlişki genişletme (örn. `['user', 'tags']`). |

---

## Sayfalama

| Yöntem | Açıklama |
|------|------|
| `setPage(page)` / `getPage()` | Mevcut sayfa (1'den başlar). |
| `setPageSize(size)` / `getPageSize()` | Sayfa başına öğe sayısı, varsayılan 20. |
| `getTotalPage()` | Toplam sayfa sayısı. |
| `getCount()` | Toplam kayıt sayısı (sunucu tarafı meta verisinden). |
| `next()` / `previous()` / `goto(page)` | Sayfayı değiştirir ve `refresh` işlemini tetikler. |

---

## Seçili Satırlar (Tablo Senaryoları)

| Yöntem | Açıklama |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Toplu silme ve diğer işlemler için kullanılan, o an seçili olan satır verileri. |

---

## CRUD ve Liste İşlemleri

| Yöntem | Açıklama |
|------|------|
| `refresh()` | Mevcut parametrelerle listeyi ister, `getData()` ve sayfalama meta verilerini günceller ve `'refresh'` olayını tetikler. |
| `get(filterByTk)` | Tek bir kayıt ister ve onu döndürür (`getData` üzerine yazmaz). |
| `create(data, options?)` | Kayıt oluşturur. İsteğe bağlı `{ refresh: false }` otomatik yenilemeyi engeller. `'saved'` olayını tetikler. |
| `update(filterByTk, data, options?)` | Birincil anahtara göre kaydı günceller. |
| `destroy(target)` | Kayıtları siler; `target` bir birincil anahtar, bir satır nesnesi veya birincil anahtarlar/satır nesneleri dizisi (toplu silme) olabilir. |
| `destroySelectedRows()` | O an seçili olan satırları siler (hiçbiri seçilmemişse hata fırlatır). |
| `setItem(index, item)` | Belirli bir veri satırını yerel olarak değiştirir (istek başlatmaz). |
| `runAction(actionName, options)` | Herhangi bir kaynak eylemini çağırır (örn. özel eylemler). |

---

## Yapılandırma ve Olaylar

| Yöntem | Açıklama |
|------|------|
| `setRefreshAction(name)` | Yenileme sırasında çağrılan eylem, varsayılan `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Oluşturma/güncelleme için istek yapılandırması. |
| `on('refresh', fn)` / `on('saved', fn)` | Yenileme tamamlandıktan veya kaydetme işleminden sonra tetiklenir. |

---

## Örnekler

### Temel Liste

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtreleme ve Sıralama

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### İlişki Genişletme

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Oluşturma ve Sayfalama

```js
await ctx.resource.create({ name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Seçili Satırları Toplu Silme

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Lütfen önce veri seçin');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Silindi'));
```

### refresh Olayını Dinleme

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### İlişkili Kaynak (Alt Tablo)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Notlar

- **setResourceName zorunludur**: Kullanmadan önce `setResourceName('koleksiyon_adı')` çağrılmalıdır, aksi takdirde istek URL'si oluşturulamaz.
- **İlişkili Kaynaklar**: Kaynak adı `parent.child` formatında olduğunda (örn. `users.tags`), önce `setSourceId(üst_birincil_anahtar)` çağrılmalıdır.
- **Yenileme (Refresh) Debouncing**: Aynı olay döngüsü (event loop) içindeki birden fazla `refresh()` çağrısı, gereksiz istekleri önlemek için yalnızca sonuncusunu yürütür.
- **getData bir Dizi döndürür**: Liste API'si tarafından döndürülen `data`, bir kayıt dizisidir ve `getData()` bu diziyi doğrudan döndürür.

---

## İlgili

- [ctx.resource](../context/resource.md) - Mevcut bağlamdaki kaynak örneği
- [ctx.initResource()](../context/init-resource.md) - Başlat ve ctx.resource'a bağla
- [ctx.makeResource()](../context/make-resource.md) - Bağlamadan yeni bir kaynak örneği oluştur
- [APIResource](./api-resource.md) - URL ile istenen genel API kaynağı
- [SingleRecordResource](./single-record-resource.md) - Tek bir kayda yönelik