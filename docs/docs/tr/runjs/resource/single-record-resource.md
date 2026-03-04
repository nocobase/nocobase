:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/resource/single-record-resource) bakın.
:::

# SingleRecordResource

**Tek bir kayda** yönelik Resource: Veriler tek bir nesnedir; birincil anahtara göre alma, oluşturma/güncelleme (save) ve silme işlemlerini destekler. Detaylar, formlar gibi "tek kayıt" senaryoları için uygundur. [MultiRecordResource](./multi-record-resource.md)'dan farklı olarak, `SingleRecordResource`'un `getData()` metodu tek bir nesne döndürür. `setFilterByTk(id)` ile birincil anahtarı belirtirsiniz ve `save()` metodu `isNewRecord` durumuna göre otomatik olarak create veya update işlemini çağırır.

**Kalıtım Hiyerarşisi**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Oluşturma Yöntemi**: `ctx.makeResource('SingleRecordResource')` veya `ctx.initResource('SingleRecordResource')`. Kullanmadan önce `setResourceName('koleksiyon_adı')` çağrılmalıdır; birincil anahtara göre işlem yaparken `setFilterByTk(id)` kullanılmalıdır; RunJS içinde `ctx.api` çalışma ortamı tarafından enjekte edilir.

---

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Detay Bloğu** | Detay bloğu, tek bir kaydı birincil anahtara göre yüklemek için varsayılan olarak SingleRecordResource kullanır. |
| **Form Bloğu** | Yeni kayıt oluşturma/düzenleme formları SingleRecordResource kullanır; `save()` metodu create ve update işlemlerini otomatik olarak ayırt eder. |
| **JSBlock Detayları** | Bir JSBlock içinde tek bir kullanıcıyı, siparişi vb. yüklemek ve görünümü özelleştirmek için kullanılır. |
| **İlişkili Kaynaklar** | `users.profile` gibi formatlarda ilişkili tekil kayıtları yüklemek için kullanılır; `setSourceId(üstKayıtID)` ile birlikte kullanılması gerekir. |

---

## Veri Formatı

- `getData()` **tek bir kayıt nesnesi** döndürür; bu, get API yanıtındaki `data` alanına karşılık gelir.
- `getMeta()` meta verileri döndürür (varsa).

---

## Kaynak Adı ve Birincil Anahtar

| Metot | Açıklama |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Kaynak adı, örn. `'users'`, `'users.profile'` (ilişkili kaynak). |
| `setSourceId(id)` / `getSourceId()` | İlişkili kaynaklar için üst kayıt ID'si (örn. `users.profile` için `users` kaydının birincil anahtarı gerekir). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Veri kaynağı tanımlayıcısı (çoklu veri kaynağı ortamlarında kullanılır). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Mevcut kaydın birincil anahtarı; ayarlandıktan sonra `isNewRecord` değeri false olur. |

---

## Durum

| Özellik/Metot | Açıklama |
|----------|------|
| `isNewRecord` | "Yeni" kayıt durumunda olup olmadığı (filterByTk ayarlanmadığında veya yeni oluşturulduğunda true olur). |

---

## İstek Parametreleri (Filtreleme / Alanlar)

| Metot | Açıklama |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtreleme (yeni kayıt durumunda değilken kullanılabilir). |
| `setFields(fields)` / `getFields()` | İstek atılacak alanlar. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | İlişki genişletme (appends). |

---

## CRUD

| Metot | Açıklama |
|------|------|
| `refresh()` | Mevcut `filterByTk` değerine göre get isteği atar ve `getData()`'yı günceller; yeni kayıt durumunda istek atmaz. |
| `save(data, options?)` | Yeni kayıt durumunda create, aksi takdirde update çağırır; `{ refresh: false }` seçeneği otomatik yenilemeyi engeller. |
| `destroy(options?)` | Mevcut `filterByTk` değerine göre kaydı siler ve yerel veriyi temizler. |
| `runAction(actionName, options)` | Herhangi bir kaynak eylemini (action) çağırır. |

---

## Yapılandırma ve Olaylar

| Metot | Açıklama |
|------|------|
| `setSaveActionOptions(options)` | save eylemi sırasındaki istek yapılandırması. |
| `on('refresh', fn)` / `on('saved', fn)` | Yenileme tamamlandığında veya kaydedildikten sonra tetiklenir. |

---

## Örnekler

### Temel Alma ve Güncelleme

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Güncelleme
await ctx.resource.save({ name: 'Ahmet Yılmaz' });
```

### Yeni Kayıt Oluşturma

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Mehmet Demir', email: 'mehmet@example.com' });
```

### Kaydı Silme

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// destroy işleminden sonra getData() null döner
```

### İlişki Yükleme ve Alanlar

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### İlişkili Kaynaklar (örn. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Üst kayıt birincil anahtarı
res.setFilterByTk(profileId);    // Eğer profile bir hasOne ilişkisi ise filterByTk atlanabilir
await res.refresh();
const profile = res.getData();
```

### Otomatik Yenileme Olmadan Kaydetme

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Kaydetme sonrası yenileme tetiklenmediği için getData() eski değerini korur
```

### refresh / saved Olaylarını Dinleme

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Kullanıcı: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Başarıyla kaydedildi');
});
await ctx.resource?.refresh?.();
```

---

## Notlar

- **setResourceName Zorunludur**: Kullanmadan önce `setResourceName('koleksiyon_adı')` çağrılmalıdır, aksi takdirde istek URL'si oluşturulamaz.
- **filterByTk ve isNewRecord**: `setFilterByTk` çağrılmadığında `isNewRecord` değeri true olur ve `refresh()` isteği başlatmaz; `save()` ise create işlemini yürütür.
- **İlişkili Kaynaklar**: Kaynak adı `üst.alt` formatında olduğunda (örn. `users.profile`), önce `setSourceId(üstBirincilAnahtar)` çağrılmalıdır.
- **getData Bir Nesnedir**: Tekil kayıt API'lerinden dönen `data` bir kayıt nesnesidir; `getData()` doğrudan bu nesneyi döndürür. `destroy()` işleminden sonra `null` olur.

---

## İlgili Konular

- [ctx.resource](../context/resource.md) - Mevcut bağlamdaki resource örneği
- [ctx.initResource()](../context/init-resource.md) - Başlat ve `ctx.resource`'a bağla
- [ctx.makeResource()](../context/make-resource.md) - Bağlamadan yeni bir resource örneği oluştur
- [APIResource](./api-resource.md) - URL'ye göre istek atan genel API kaynağı
- [MultiRecordResource](./multi-record-resource.md) - Koleksiyonlara/listelere yönelik, CRUD ve sayfalama destekli kaynak