:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/set-value) bakın.
:::

# ctx.setValue()

JSField, JSItem gibi düzenlenebilir alan senaryolarında mevcut alanın değerini ayarlar. `ctx.getValue()` ile birlikte kullanıldığında form ile çift yönlü bağlama (two-way binding) sağlar.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSField** | Düzenlenebilir özel alanlara kullanıcı tarafından seçilen veya hesaplanan değerleri yazar. |
| **JSItem** | Tabloların/alt tabloların düzenlenebilir öğelerinde mevcut hücre değerini günceller. |
| **JSColumn** | Tablo sütunu oluşturulurken mantığa dayalı olarak ilgili satırın alan değerini günceller. |

> **Not**: `ctx.setValue(v)` yalnızca form bağlaması olan RunJS bağlamlarında kullanılabilir. İş akışları (FlowEngine), etkileşim kuralları veya JSBlock gibi alan bağlaması olmayan senaryolarda bu yöntem mevcut değildir. Kullanmadan önce isteğe bağlı zincirleme (optional chaining) kullanmanız önerilir: `ctx.setValue?.(value)`.

## Tip Tanımı

```ts
setValue<T = any>(value: T): void;
```

- **Parametreler**: `value`, yazılacak alan değeridir; tipi, alanın form öğesi tipine göre belirlenir.

## Davranış

- `ctx.setValue(v)`, mevcut alanın Ant Design Form üzerindeki değerini günceller ve ilgili form etkileşimlerini ve doğrulama mantığını tetikler.
- Form henüz oluşturulmamışsa veya alan kaydedilmemişse çağrı etkisiz olabilir. Yazma sonucunu doğrulamak için `ctx.getValue()` ile birlikte kullanılması önerilir.

## Örnekler

### getValue ile Çift Yönlü Bağlama

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Koşula Bağlı Varsayılan Değer Atama

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Diğer Alanlarla Etkileşim Halindeyken Mevcut Alana Geri Yazma

```ts
// Başka bir alan değiştiğinde mevcut alanı eşzamanlı olarak güncelle
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Özel', value: 'custom' });
}
```

## Dikkat Edilmesi Gerekenler

- Düzenlenemeyen alanlarda (örneğin Salt Okunur moddaki JSField veya JSBlock), `ctx.setValue` değeri `undefined` olabilir. Hataları önlemek için `ctx.setValue?.(value)` kullanılması önerilir.
- İlişki alanları (M2O, O2M vb.) için değer atarken, alan yapılandırmasına bağlı olarak alan tipiyle eşleşen bir yapı (örneğin `{ id, [titleField]: label }`) iletmeniz gerekir.

## İlgili

- [ctx.getValue()](./get-value.md) - Mevcut alan değerini alır, çift yönlü bağlama için setValue ile birlikte kullanılır.
- [ctx.form](./form.md) - Diğer alanları okumak veya yazmak için kullanılan Ant Design Form örneği.
- `js-field:value-change` - Dış değer değiştiğinde tetiklenen ve görünümü güncellemek için kullanılan kapsayıcı olayı.