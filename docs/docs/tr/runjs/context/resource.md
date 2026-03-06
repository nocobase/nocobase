:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/resource) bakın.
:::

# ctx.resource

Verilere erişmek ve verileri işlemek için kullanılan mevcut bağlamdaki **FlowResource** örneğidir. Çoğu blokta (Formlar, Tablolar, Detaylar vb.) ve açılır pencere (pop-up) senaryolarında, çalışma zamanı ortamı `ctx.resource`'u önceden bağlar. JSBlock gibi varsayılan olarak bir kaynağın bulunmadığı senaryolarda, `ctx.resource` üzerinden kullanmadan önce [ctx.initResource()](./init-resource.md) çağrılarak başlatılması gerekir.

## Uygulama Senaryoları

Yapılandırılmış verilere (listeler, tek kayıtlar, özel API'ler, SQL) erişim gerektiren tüm RunJS senaryolarında kullanılabilir. Form, Tablo, Detay blokları ve açılır pencereler genellikle önceden bağlanmıştır. JSBlock, JSField, JSItem, JSColumn vb. için veri yükleme gerekiyorsa, önce `ctx.initResource(type)` çağrılabilir ve ardından `ctx.resource`'a erişilebilir.

## Tür Tanımı

```ts
resource: FlowResource | undefined;
```

- Önceden bağlamanın olduğu bağlamlarda, `ctx.resource` ilgili kaynak örneğidir;
- JSBlock gibi varsayılan olarak kaynağın olmadığı senaryolarda `undefined` değerindedir, `ctx.initResource(type)` çağrıldıktan sonra bir değer kazanır.

## Yaygın Yöntemler

Farklı kaynak türleri (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) tarafından sunulan yöntemler biraz farklılık gösterebilir. Aşağıdakiler genel veya yaygın olarak kullanılan yöntemlerdir:

| Yöntem | Açıklama |
|------|------|
| `getData()` | Mevcut verileri alır (liste veya tek kayıt) |
| `setData(value)` | Yerel verileri ayarlar |
| `refresh()` | Verileri yenilemek için mevcut parametrelerle bir istek başlatır |
| `setResourceName(name)` | Kaynak adını ayarlar (örneğin `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Birincil anahtar filtresini ayarlar (tek kayıt `get` vb. için) |
| `runAction(actionName, options)` | Herhangi bir kaynak eylemini (action) çağırır (örneğin `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Olaylara abone olur/aboneliği iptal eder (örneğin `refresh`, `saved`) |

**MultiRecordResource'a Özgü**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()` vb.

## Örnekler

### Liste Verileri (Önce initResource gerektirir)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Tablo Senaryosu (Önceden bağlanmış)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Silindi'));
```

### Tek Kayıt

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Özel Bir Eylemi (Action) Çağırma

```js
await ctx.resource.runAction('create', { data: { name: 'Ahmet Yılmaz' } });
```

## ctx.initResource / ctx.makeResource ile İlişkisi

- **ctx.initResource(type)**: Eğer `ctx.resource` mevcut değilse bir tane oluşturur ve bağlar; zaten mevcutsa mevcut örneği döndürür. `ctx.resource`'un kullanılabilir olmasını sağlar.
- **ctx.makeResource(type)**: Yeni bir kaynak örneği oluşturur ve döndürür, ancak bunu `ctx.resource` içine **yazmaz**. Birden fazla bağımsız kaynak gerektiren veya geçici kullanım senaryoları için uygundur.
- **ctx.resource**: Mevcut bağlama zaten bağlı olan kaynağa erişir. Çoğu blok/açılır pencere önceden bağlanmıştır; aksi takdirde `undefined` değerindedir ve önce `ctx.initResource` gerektirir.

## Notlar

- Kullanmadan önce boş değer kontrolü yapmanız önerilir: `ctx.resource?.refresh()`, özellikle JSBlock gibi önceden bağlamanın olmayabileceği senaryolarda.
- Başlatma işleminden sonra, `refresh()` ile verileri yüklemeden önce koleksiyonu belirtmek için `setResourceName(name)` çağrılmalıdır.
- Her Kaynak (Resource) türünün tam API'si için aşağıdaki bağlantılara bakınız.

## İlgili

- [ctx.initResource()](./init-resource.md) - Kaynağı başlatır ve mevcut bağlama bağlar
- [ctx.makeResource()](./make-resource.md) - `ctx.resource`'a bağlamadan yeni bir kaynak örneği oluşturur
- [MultiRecordResource](../resource/multi-record-resource.md) - Çoklu kayıtlar/Listeler
- [SingleRecordResource](../resource/single-record-resource.md) - Tek kayıt
- [APIResource](../resource/api-resource.md) - Genel API kaynağı
- [SQLResource](../resource/sql-resource.md) - SQL sorgu kaynağı