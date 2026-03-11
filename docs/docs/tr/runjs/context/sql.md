:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/sql) bakın.
:::

# ctx.sql

`ctx.sql`, SQL yürütme ve yönetimi yetenekleri sağlar; genellikle veritabanına doğrudan erişmek için RunJS (JS Bloğu, iş akışı gibi) içerisinde kullanılır. Geçici SQL yürütme, kaydedilmiş SQL şablonlarını ID ile çalıştırma, parametre bağlama (binding), şablon değişkenleri (`{{ctx.xxx}}`) ve sonuç türü kontrolünü destekler.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JS Bloğu** | Özel istatistiksel raporlar, karmaşık filtrelenmiş listeler, tablolar arası toplama (aggregation) sorguları. |
| **Grafik Bloğu** | Grafik veri kaynaklarını beslemek için SQL şablonlarını kaydetme. |
| **İş Akışı / Bağlantı** | Veri almak ve sonraki mantıksal işlemlerde kullanmak için önceden ayarlanmış SQL'leri yürütme. |
| **SQLResource** | Sayfalandırılmış listeler gibi senaryolar için `ctx.initResource('SQLResource')` ile birlikte kullanılır. |

> Not: `ctx.sql`, veritabanına `flowSql` API'si aracılığıyla erişir; mevcut kullanıcının ilgili veri kaynağı için yürütme izinlerine sahip olduğundan emin olunmalıdır.

## Yetki Açıklaması

| Yetki | Yöntem | Açıklama |
|------|------|------|
| **Giriş Yapmış Kullanıcı** | `runById` | Yapılandırılmış bir SQL şablon ID'sine göre yürütür. |
| **SQL Yapılandırma Yetkisi** | `run`, `save`, `destroy` | Geçici SQL yürütme, SQL şablonlarını kaydetme/güncelleme/silme. |

Sıradan kullanıcılara yönelik ön yüz mantığı için `ctx.sql.runById(uid, options)` kullanılmalıdır; dinamik SQL veya şablon yönetimi gerektiğinde, mevcut rolün SQL yapılandırma yetkisine sahip olduğundan emin olunmalıdır.

## Tür Tanımı

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Yaygın Yöntemler

| Yöntem | Açıklama | Yetki Gereksinimi |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Geçici SQL yürütür; parametre bağlama ve şablon değişkenlerini destekler. | SQL Yapılandırma Yetkisi |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Yeniden kullanım için bir SQL şablonunu ID ile kaydeder veya günceller. | SQL Yapılandırma Yetkisi |
| `ctx.sql.runById(uid, options?)` | Daha önce kaydedilmiş bir SQL şablonunu ID'sine göre yürütür. | Tüm giriş yapmış kullanıcılar |
| `ctx.sql.destroy(uid)` | Belirtilen ID'ye sahip SQL şablonunu siler. | SQL Yapılandırma Yetkisi |

Not:

- `run`, SQL hata ayıklama (debug) için kullanılır ve yapılandırma yetkisi gerektirir;
- `save` ve `destroy`, SQL şablonlarını yönetmek için kullanılır ve yapılandırma yetkisi gerektirir;
- `runById` sıradan kullanıcılara açıktır; yalnızca kaydedilmiş şablonları yürütebilir, SQL üzerinde hata ayıklama yapamaz veya SQL'i değiştiremez;
- Bir SQL şablonu değiştirildiğinde, değişikliklerin kalıcı olması için `save` çağrılmalıdır.

## Parametre Açıklamaları

### run / runById için options

| Parametre | Tür | Açıklama |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Bağlama değişkenleri. Nesne biçimi `:name` ile, dizi biçimi `?` ile kullanılır. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Sonuç türü: çok satırlı, tek satırlı, tek değerli. Varsayılan: `selectRows`. |
| `dataSourceKey` | `string` | Veri kaynağı tanımlayıcısı, varsayılan olarak ana veri kaynağı kullanılır. |
| `filter` | `Record<string, any>` | Ek filtreleme koşulları (arayüz desteğine bağlı olarak). |

### save için options

| Parametre | Tür | Açıklama |
|------|------|------|
| `uid` | `string` | Şablonun benzersiz tanımlayıcısı; kaydedildikten sonra `runById(uid, ...)` ile yürütülebilir. |
| `sql` | `string` | SQL içeriği; `{{ctx.xxx}}` şablon değişkenlerini ve `:name` / `?` yer tutucularını destekler. |
| `dataSourceKey` | `string` | İsteğe bağlı, veri kaynağı tanımlayıcısı. |

## SQL Şablon Değişkenleri ve Parametre Bağlama

### Şablon Değişkenleri `{{ctx.xxx}}`

SQL içerisinde bağlam değişkenlerine atıfta bulunmak için `{{ctx.xxx}}` kullanılabilir; bunlar yürütme öncesinde gerçek değerlerine dönüştürülür:

```js
// ctx.user.id referansı
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Atıfta bulunulabilecek değişken kaynakları `ctx.getVar()` ile aynıdır (örneğin: `ctx.user.*`, `ctx.record.*`, özel `ctx.defineProperty` vb.).

### Parametre Bağlama

- **Adlandırılmış Parametreler**: SQL'de `:name` kullanılır, `bind` içerisine `{ name: value }` nesnesi gönderilir.
- **Konumsal Parametreler**: SQL'de `?` kullanılır, `bind` içerisine `[value1, value2]` dizisi gönderilir.

```js
// Adlandırılmış parametreler
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Konumsal parametreler
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Istanbul', 'active'], type: 'selectVar' }
);
```

## Örnekler

### Geçici SQL Yürütme (SQL Yapılandırma Yetkisi Gerektirir)

```js
// Çok satırlı sonuç (varsayılan)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Tek satırlı sonuç
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Tek değerli sonuç (örneğin: COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Şablon Değişkenlerini Kullanma

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Şablonu Kaydetme ve Yeniden Kullanma

```js
// Kaydetme (SQL Yapılandırma Yetkisi Gerektirir)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Tüm giriş yapmış kullanıcılar yürütebilir
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Şablonu silme (SQL Yapılandırma Yetkisi Gerektirir)
await ctx.sql.destroy('active-users-report');
```

### Sayfalandırılmış Liste (SQLResource)

```js
// Sayfalandırma veya filtreleme gerektiğinde SQLResource kullanılabilir
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // Kaydedilmiş SQL şablon ID'si
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // page, pageSize vb. içerir
```

## ctx.resource ve ctx.request ile İlişkisi

| Kullanım Amacı | Önerilen Kullanım |
|------|----------|
| **SQL Sorgusu Yürütme** | `ctx.sql.run()` veya `ctx.sql.runById()` |
| **SQL Sayfalandırılmış Liste (Blok)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Genel HTTP İsteği** | `ctx.request()` |

`ctx.sql`, `flowSql` API'sini sarmalar ve SQL senaryolarına özeldir; `ctx.request` ise herhangi bir API'yi çağırmak için kullanılabilir.

## Dikkat Edilmesi Gerekenler

- SQL enjeksiyonunu önlemek için dize birleştirme yerine parametre bağlama (`:name` / `?`) kullanın.
- `type: 'selectVar'` kullanıldığında skaler bir değer döner; genellikle `COUNT`, `SUM` gibi işlemler için kullanılır.
- Şablon değişkenleri `{{ctx.xxx}}` yürütme öncesinde çözümlenir; bağlamda ilgili değişkenlerin tanımlandığından emin olun.

## İlgili Konular

- [ctx.resource](./resource.md): Veri kaynakları; SQLResource dahili olarak `flowSql` API'sini çağırır.
- [ctx.initResource()](./init-resource.md): Sayfalandırılmış listeler vb. için SQLResource'u başlatır.
- [ctx.request()](./request.md): Genel HTTP istekleri.