:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/resource/sql-resource) bakın.
:::

# SQLResource

**Kaydedilmiş SQL yapılandırmalarına** veya **dinamik SQL**'e dayalı sorguları yürüten bir Resource'dur. Veri kaynağı `flowSql:run` / `flowSql:runById` gibi arayüzlerdir. Raporlar, istatistikler ve özel SQL listeleri gibi senaryolar için uygundur. [MultiRecordResource](./multi-record-resource.md)'dan farklı olarak, SQLResource koleksiyonlara bağımlı değildir; SQL sorgularını doğrudan yürütür, sayfalandırmayı, parametre bağlamayı (binding), şablon değişkenlerini (`{{ctx.xxx}}`) ve sonuç tipi kontrolünü destekler.

**Kalıtım ilişkisi**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Oluşturma yöntemi**: `ctx.makeResource('SQLResource')` veya `ctx.initResource('SQLResource')`. Kaydedilmiş bir yapılandırmaya göre yürütmek için `setFilterByTk(uid)` (SQL şablonunun uid'si) kullanılır; hata ayıklama (debug) sırasında SQL'i doğrudan yürütmek için `setDebug(true)` + `setSQL(sql)` kullanılabilir; RunJS içinde `ctx.api` çalışma ortamı tarafından enjekte edilir.

---

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Raporlar / İstatistikler** | Karmaşık toplama (aggregation), tablolar arası sorgular ve özel istatistiksel metrikler. |
| **JSBlock Özel Listeler** | SQL ile özel filtreleme, sıralama veya ilişkilendirme gerçekleştirme ve özel işleme (rendering). |
| **Grafik Blokları** | Grafik veri kaynaklarını sürmek için kaydedilmiş SQL şablonlarını kullanma, sayfalandırma desteği. |
| **SQLResource ve ctx.sql Seçimi** | Sayfalandırma, olaylar (events) veya reaktif veri gerektiğinde SQLResource kullanın; basit ve tek seferlik sorgular için `ctx.sql.run()` / `ctx.sql.runById()` kullanılabilir. |

---

## Veri Formatı

- `getData()`, `setSQLType()` değerine göre farklı formatlar döndürür:
  - `selectRows` (varsayılan): **Dizi**, çok satırlı sonuçlar.
  - `selectRow`: **Tek nesne**.
  - `selectVar`: **Skaler değer** (örneğin COUNT, SUM).
- `getMeta()` sayfalandırma gibi meta bilgileri döndürür: `page`, `pageSize`, `count`, `totalPage` vb.

---

## SQL Yapılandırması ve Yürütme Modları

| Yöntem | Açıklama |
|------|------|
| `setFilterByTk(uid)` | Yürütülecek SQL şablonunun uid'sini ayarlar (runById'ye karşılık gelir, önce yönetim panelinde kaydedilmelidir). |
| `setSQL(sql)` | Ham SQL'i ayarlar (yalnızca hata ayıklama modu `setDebug(true)` etkinken runBySQL için kullanılır). |
| `setSQLType(type)` | Sonuç tipi: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | true olduğunda refresh `runBySQL()` üzerinden çalışır, aksi takdirde `runById()` üzerinden çalışır. |
| `run()` | Hata ayıklama durumuna göre `runBySQL()` veya `runById()` çağırır. |
| `runBySQL()` | Mevcut `setSQL` ile ayarlanan SQL'i yürütür (`setDebug(true)` gerektirir). |
| `runById()` | Mevcut uid'yi kullanarak kaydedilmiş SQL şablonunu yürütür. |

---

## Parametreler ve Bağlam

| Yöntem | Açıklama |
|------|------|
| `setBind(bind)` | Değişkenleri bağlar. `:name` yer tutucuları için nesne formunda, `?` yer tutucuları için dizi formunda kullanılır. |
| `setLiquidContext(ctx)` | Şablon bağlamı (Liquid), `{{ctx.xxx}}` ifadelerini çözümlemek için kullanılır. |
| `setFilter(filter)` | Ek filtreleme koşulları (istek verisine aktarılır). |
| `setDataSourceKey(key)` | Veri kaynağı tanımlayıcısı (çoklu veri kaynakları kullanıldığında). |

---

## Sayfalandırma

| Yöntem | Açıklama |
|------|------|
| `setPage(page)` / `getPage()` | Mevcut sayfa (varsayılan 1). |
| `setPageSize(size)` / `getPageSize()` | Sayfa başına kayıt sayısı (varsayılan 20). |
| `next()` / `previous()` / `goto(page)` | Sayfayı değiştirir ve refresh'i tetikler. |

SQL içinde sayfalandırma parametrelerine atıfta bulunmak için `{{ctx.limit}}` ve `{{ctx.offset}}` kullanılabilir. SQLResource, bağlama otomatik olarak `limit` ve `offset` enjekte eder.

---

## Veri Çekme ve Olaylar

| Yöntem | Açıklama |
|------|------|
| `refresh()` | SQL'i yürütür (runById veya runBySQL), sonucu `setData(data)`'ya yazar, meta verileri günceller ve `'refresh'` olayını tetikler. |
| `runAction(actionName, options)` | Alt katman arayüzlerini çağırır (örneğin `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Yenileme tamamlandığında veya yükleme başladığında tetiklenir. |

---

## Örnekler

### Kaydedilmiş Şablona Göre Yürütme (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // Kaydedilmiş SQL şablonu uid'si
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count vb.
```

### Hata Ayıklama Modu: SQL'i Doğrudan Yürütme (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Sayfalandırma ve Gezinme

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Sayfalar arası gezinme
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Sonuç Tipleri

```js
// Çok satırlı (varsayılan)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Tek satır
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Tek değer (örneğin COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Şablon Değişkenlerini Kullanma

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### refresh Olayını Dinleme

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Notlar

- **runById için önce şablonun kaydedilmesi gerekir**: `setFilterByTk(uid)` içindeki uid, yönetim panelinde önceden kaydedilmiş bir SQL şablonu ID'si olmalıdır; `ctx.sql.save({ uid, sql })` ile kaydedilebilir.
- **Hata ayıklama modu yetki gerektirir**: `setDebug(true)` olduğunda `flowSql:run` kullanılır ve mevcut rolün SQL yapılandırma yetkisine sahip olması gerekir; `runById` için yalnızca giriş yapmış olmak yeterlidir.
- **refresh anti-shake (debouncing)**: Aynı olay döngüsü içinde `refresh()`'in birden çok kez çağrılması, gereksiz istekleri önlemek için yalnızca sonuncusunu yürütür.
- **Parametre bağlama ile enjeksiyon önleme**: SQL enjeksiyonunu önlemek için dize birleştirme yerine `setBind()` ile birlikte `:name` / `?` yer tutucularını kullanın.

---

## İlgili Konular

- [ctx.sql](../context/sql.md) - SQL yürütme ve yönetimi; `ctx.sql.runById` basit tek seferlik sorgular için uygundur.
- [ctx.resource](../context/resource.md) - Mevcut bağlamdaki resource örneği.
- [ctx.initResource()](../context/init-resource.md) - Başlatır ve `ctx.resource`'a bağlar.
- [ctx.makeResource()](../context/make-resource.md) - Bağlamadan yeni bir resource örneği oluşturur.
- [APIResource](./api-resource.md) - Genel API kaynağı.
- [MultiRecordResource](./multi-record-resource.md) - Koleksiyonlar ve listeler için tasarlanmıştır.