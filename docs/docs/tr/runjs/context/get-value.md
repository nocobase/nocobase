:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/get-value) bakın.
:::

# ctx.getValue()

JSField ve JSItem gibi düzenlenebilir alan senaryolarında, mevcut alanın en güncel değerini almak için kullanılır. `ctx.setValue(v)` ile birlikte kullanıldığında form ile çift yönlü bağlama (two-way binding) sağlar.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSField** | Düzenlenebilir özel alanlarda kullanıcı girişini veya mevcut form değerini okur. |
| **JSItem** | Tabloların/alt tabloların düzenlenebilir öğelerinde mevcut hücre değerini okur. |
| **JSColumn** | Tablo sütunu oluşturulurken ilgili satırın alan değerini okur. |

> **Not**: `ctx.getValue()` yalnızca form bağlaması olan RunJS bağlamlarında kullanılabilir; iş akışları veya etkileşim kuralları gibi alan bağlaması olmayan senaryolarda bu yöntem mevcut değildir.

## Tür Tanımı

```ts
getValue<T = any>(): T | undefined;
```

- **Dönüş Değeri**: Alanın form öğesi türüne göre belirlenen mevcut alan değeri; alan kaydedilmemişse veya doldurulmamışsa `undefined` dönebilir.

## Değer Alma Sırası

`ctx.getValue()` değerleri aşağıdaki sırayla alır:

1. **Form Durumu**: Öncelikli olarak Ant Design Form'un mevcut durumundan okur.
2. **Yedek Değer (Fallback)**: Alan formda mevcut değilse, alanın başlangıç değerine veya props'larına geri döner.

> Form henüz oluşturulmamışsa veya alan kaydedilmemişse `undefined` dönebilir.

## Örnekler

### Mevcut değere göre oluşturma (render)

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Lütfen önce içerik girin</span>);
} else {
  ctx.render(<span>Mevcut değer: {current}</span>);
}
```

### setValue ile çift yönlü bağlama

```tsx
const { Input } = ctx.libs.antd;

// Varsayılan değer olarak mevcut değeri oku
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## İlgili Konular

- [ctx.setValue()](./set-value.md) - Mevcut alan değerini ayarlar, `getValue` ile birlikte çift yönlü bağlama sağlar.
- [ctx.form](./form.md) - Diğer alanları okumak/yazmak için kullanılan Ant Design Form örneği.
- `js-field:value-change` - Dış değerler değiştiğinde tetiklenen ve görünümü güncellemek için kullanılan kapsayıcı olayı.