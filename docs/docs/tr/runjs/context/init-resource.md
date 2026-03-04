:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/init-resource) bakın.
:::

# ctx.initResource()

Mevcut bağlam (context) için kaynağı (resource) **başlatır**: Eğer `ctx.resource` henüz mevcut değilse, belirtilen türde bir kaynak oluşturur ve bağlama atar; zaten mevcutsa doğrudan onu kullanır. Daha sonra `ctx.resource` üzerinden erişilebilir.

## Uygulama Senaryoları

Genellikle **JSBlock** (bağımsız blok) senaryolarında kullanılır. Çoğu blok, açılır pencere (popup) ve diğer bileşenlerde `ctx.resource` önceden bağlanmıştır ve manuel çağrı gerektirmez. JSBlock varsayılan olarak bir kaynağa sahip değildir, bu nedenle `ctx.resource` üzerinden veri yüklemeden önce `ctx.initResource(type)` çağrılmalıdır.

## Tür Tanımı

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parametre | Tür | Açıklama |
|-----------|------|-------------|
| `type` | `string` | Kaynak türü: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Dönüş Değeri**: Mevcut bağlamdaki kaynak örneği (yani `ctx.resource`).

## ctx.makeResource() ile Farkı

| Yöntem | Davranış |
|--------|----------|
| `ctx.initResource(type)` | `ctx.resource` mevcut değilse oluşturur ve bağlar; mevcutsa olanı döndürür. `ctx.resource`'un kullanılabilir olmasını sağlar. |
| `ctx.makeResource(type)` | Sadece yeni bir örnek oluşturur ve döndürür, `ctx.resource` üzerine **yazmaz**. Birden fazla bağımsız kaynak gerektiren veya geçici kullanım senaryoları için uygundur. |

## Örnekler

### Liste Verileri (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Tek Kayıt (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Birincil anahtarı belirtin
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Veri Kaynağını Belirtme

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Notlar

- Çoğu blok senaryosunda (Formlar, Tablolar, Detaylar vb.) ve açılır pencerelerde, `ctx.resource` çalışma zamanı ortamı tarafından zaten önceden bağlanmıştır, bu nedenle `ctx.initResource` çağrılmasına gerek yoktur.
- Manuel başlatma yalnızca JSBlock gibi varsayılan bir kaynağın bulunmadığı bağlamlarda gereklidir.
- Başlatma işleminden sonra, koleksiyonu belirtmek için `setResourceName(name)` çağrılmalı ve ardından verileri yüklemek için `refresh()` kullanılmalıdır.

## İlgili

- [ctx.resource](./resource.md) — Mevcut bağlamdaki kaynak örneği
- [ctx.makeResource()](./make-resource.md) — `ctx.resource`'a bağlamadan yeni bir kaynak örneği oluşturur
- [MultiRecordResource](../resource/multi-record-resource.md) — Çoklu kayıtlar/Liste
- [SingleRecordResource](../resource/single-record-resource.md) — Tek kayıt
- [APIResource](../resource/api-resource.md) — Genel API kaynağı
- [SQLResource](../resource/sql-resource.md) — SQL sorgu kaynağı