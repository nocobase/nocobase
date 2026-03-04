:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/block-model) bakın.
:::

# ctx.blockModel

Mevcut JS alanı / JS bloğunun bulunduğu üst blok modeli (BlockModel örneği). JSField, JSItem ve JSColumn gibi senaryolarda `ctx.blockModel`, mevcut JS mantığını taşıyan form bloğunu veya tablo bloğunu işaret eder. Bağımsız bir JSBlock içinde `null` olabilir veya `ctx.model` ile aynı olabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSField** | Bağlantı (linkage) veya doğrulama gerçekleştirmek için bir form alanı içinden üst form bloğunun `form`, `koleksiyon` ve `kaynağına` erişin. |
| **JSItem** | Bir alt tablo öğesi içinden üst tablo/form bloğunun kaynak ve koleksiyon bilgilerine erişin. |
| **JSColumn** | Bir tablo sütunu içinden üst tablo bloğunun `resource` (örneğin `getSelectedRows`) ve `koleksiyonuna` erişin. |
| **Form İşlemleri / İş Akışı** | Gönderim öncesi doğrulama için `form`'a, yenileme vb. işlemler için `resource`'a erişin. |

> Not: `ctx.blockModel` yalnızca bir üst bloğun bulunduğu RunJS bağlamlarında kullanılabilir. Üst form/tablo içermeyen bağımsız JSBlock'larda `null` olabilir; kullanmadan önce boş değer kontrolü yapılması önerilir.

## Tür Tanımı

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Belirli tür, üst blok türüne bağlıdır: form blokları çoğunlukla `FormBlockModel` veya `EditFormModel`, tablo blokları ise çoğunlukla `TableBlockModel`'dir.

## Yaygın Özellikler

| Özellik | Tür | Açıklama |
|------|------|------|
| `uid` | `string` | Blok modelinin benzersiz kimliği |
| `collection` | `Collection` | Mevcut bloğa bağlı koleksiyon |
| `resource` | `Resource` | Blok tarafından kullanılan kaynak örneği (`SingleRecordResource` / `MultiRecordResource` vb.) |
| `form` | `FormInstance` | Form Bloğu: `getFieldsValue`, `validateFields`, `setFieldsValue` vb. destekleyen Ant Design Form örneği |
| `emitter` | `EventEmitter` | `formValuesChange`, `onFieldReset` vb. olayları dinlemek için kullanılan olay yayıcı |

## ctx.model ve ctx.form ile İlişkisi

| İhtiyaç | Önerilen Kullanım |
|------|----------|
| **Mevcut JS'nin üst bloğu** | `ctx.blockModel` |
| **Form alanlarını okuma/yazma** | `ctx.form` (`ctx.blockModel?.form` ile eşdeğerdir, form bloklarında daha pratiktir) |
| **Mevcut yürütme bağlamının modeli** | `ctx.model` (JSField'da alan modeli, JSBlock'ta blok modeli) |

JSField içinde `ctx.model` alan modelidir, `ctx.blockModel` ise bu alanı taşıyan form veya tablo bloğudur; `ctx.form` genellikle `ctx.blockModel.form` ile aynıdır.

## Örnekler

### Tablo: Seçili satırları al ve işle

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Lütfen önce veri seçin');
  return;
}
```

### Form Senaryosu: Doğrula ve Yenile

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Form Değişikliklerini Dinle

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // En son form değerlerine göre bağlantı veya yeniden oluşturma işlemini gerçekleştirin
});
```

### Bloğu Yeniden Oluşturmayı Tetikle

```ts
ctx.blockModel?.rerender?.();
```

## Notlar

- **Bağımsız bir JSBlock** (üst form veya tablo bloğu olmayan) içinde `ctx.blockModel` `null` olabilir. Özelliklerine erişmeden önce isteğe bağlı zincirleme (optional chaining) kullanılması önerilir: `ctx.blockModel?.resource?.refresh?.()`.
- **JSField / JSItem / JSColumn** içinde `ctx.blockModel`, mevcut alanı taşıyan form veya tablo bloğunu ifade eder. **JSBlock** içinde, gerçek hiyerarşiye bağlı olarak kendisi veya bir üst seviye blok olabilir.
- `resource` yalnızca veri bloklarında bulunur; `form` yalnızca form bloklarında bulunur, tablo bloklarında genellikle `form` bulunmaz.

## İlgili

- [ctx.model](./model.md): Mevcut yürütme bağlamının modeli
- [ctx.form](./form.md): Form örneği, form bloklarında yaygın olarak kullanılır
- [ctx.resource](./resource.md): Kaynak örneği (`ctx.blockModel?.resource` ile eşdeğerdir, varsa doğrudan kullanılır)
- [ctx.getModel()](./get-model.md): uid'ye göre diğer blok modellerini al