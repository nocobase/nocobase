:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/make-resource) bakın.
:::

# ctx.makeResource()

**Yeni** bir resource örneği oluşturur ve döndürür; `ctx.resource` değerini **yazmaz** veya **değiştirmez**. Birden fazla bağımsız resource gerektiren veya geçici kullanım senaryoları için uygundur.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **Birden fazla resource** | Aynı anda birden fazla veri kaynağını yükleme (örneğin, kullanıcı listesi + sipariş listesi); her biri bağımsız bir resource kullanır. |
| **Geçici sorgular** | Kullanıldıktan sonra atılan, `ctx.resource` nesnesine bağlanması gerekmeyen tek seferlik sorgular. |
| **Yardımcı veriler** | Ana veriler için `ctx.resource`, ek veriler için `makeResource` ile oluşturulan örnekler kullanılır. |

Yalnızca tek bir resource'a ihtiyacınız varsa ve bunu `ctx.resource` nesnesine bağlamak istiyorsanız, [ctx.initResource()](./init-resource.md) kullanmak daha uygundur.

## Tip Tanımı

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parametre | Tip | Açıklama |
|------|------|------|
| `resourceType` | `string` | Kaynak türü: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Dönüş Değeri**: Yeni oluşturulan resource örneği.

## ctx.initResource() ile Farkı

| Yöntem | Davranış |
|------|------|
| `ctx.makeResource(type)` | Sadece yeni bir örnek oluşturur ve döndürür, `ctx.resource` üzerine **yazmaz**. Birden fazla bağımsız resource elde etmek için defalarca çağrılabilir. |
| `ctx.initResource(type)` | Eğer `ctx.resource` mevcut değilse oluşturur ve bağlar; zaten mevcutsa doğrudan onu döndürür. `ctx.resource` nesnesinin kullanılabilir olmasını garanti eder. |

## Örnekler

### Tekil resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource orijinal değerini korur (varsa)
```

### Birden fazla resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Kullanıcı sayısı: {usersRes.getData().length}</p>
    <p>Sipariş sayısı: {ordersRes.getData().length}</p>
  </div>
);
```

### Geçici sorgu

```ts
// Tek seferlik sorgu, ctx.resource nesnesini kirletmez
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Notlar

- Yeni oluşturulan resource'un koleksiyonu belirtmek için `setResourceName(name)` yöntemini çağırması ve ardından `refresh()` ile verileri yüklemesi gerekir.
- Her resource örneği bağımsızdır ve birbirini etkilemez; birden fazla veri kaynağını paralel olarak yüklemek için uygundur.

## İlgili İçerikler

- [ctx.initResource()](./init-resource.md): Başlatır ve `ctx.resource` nesnesine bağlar
- [ctx.resource](./resource.md): Mevcut bağlamdaki resource örneği
- [MultiRecordResource](../resource/multi-record-resource) — Çoklu kayıt/Liste
- [SingleRecordResource](../resource/single-record-resource) — Tekli kayıt
- [APIResource](../resource/api-resource) — Genel API kaynağı
- [SQLResource](../resource/sql-resource) — SQL sorgu kaynağı