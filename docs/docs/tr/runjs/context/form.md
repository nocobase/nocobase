:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/form) bakın.
:::

# ctx.form

Mevcut blok içindeki Ant Design Form örneğidir; form alanlarını okumak/yazmak, doğrulamayı tetiklemek ve gönderim yapmak için kullanılır. `ctx.blockModel?.form` ifadesine eşdeğerdir ve form bloklarında (Form, Düzenleme Formu (EditForm), Alt form vb.) doğrudan kullanılabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSField** | Bağlantılı çalışma (linkage) gerçekleştirmek için diğer form alanlarını okumak/yazmak veya diğer alan değerlerine göre hesaplama ya da doğrulama yapmak. |
| **JSItem** | Tablo içi bağlantı sağlamak için alt tablo öğelerinde aynı satırdaki veya diğer alanları okumak/yazmak. |
| **JSColumn** | İşleme (rendering) amacıyla bir tablo sütununda ilgili satırı veya ilişkili alan değerlerini okumak. |
| **Form İşlemleri / Etkinlik Akışı** | Gönderim öncesi doğrulama, alanları toplu güncelleme, formu sıfırlama vb. |

> Not: `ctx.form` yalnızca form blokları (Form, Düzenleme Formu, Alt form vb.) ile ilgili RunJS bağlamlarında kullanılabilir; form dışı senaryolarda (bağımsız JSBlock veya Tablo blokları gibi) mevcut olmayabilir. Kullanmadan önce boş değer kontrolü yapmanız önerilir: `ctx.form?.getFieldsValue()`.

## Tür Tanımı

```ts
form: FormInstance<any>;
```

`FormInstance`, Ant Design Form'un örnek türüdür; yaygın yöntemler aşağıdadır.

## Yaygın Yöntemler

### Form Değerlerini Okuma

```ts
// Mevcut kayıtlı alanların değerlerini oku (varsayılan olarak yalnızca işlenen alanları içerir)
const values = ctx.form.getFieldsValue();

// Tüm alanların değerlerini oku (kayıtlı ancak işlenmemiş alanlar dahil, örn. gizli veya daraltılmış bölümlerdeki)
const allValues = ctx.form.getFieldsValue(true);

// Tek bir alanı oku
const email = ctx.form.getFieldValue('email');

// İç içe geçmiş alanları oku (örneğin bir alt tabloda)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Form Değerlerini Yazma

```ts
// Toplu güncelleme (genellikle bağlantılı çalışma için kullanılır)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Tek bir alanı güncelle
ctx.form.setFieldValue('remark', 'Not eklendi');
```

### Doğrulama ve Gönderim

```ts
// Form doğrulamasını tetikle
await ctx.form.validateFields();

// Form gönderimini tetikle
ctx.form.submit();
```

### Sıfırlama

```ts
// Tüm alanları sıfırla
ctx.form.resetFields();

// Yalnızca belirli alanları sıfırla
ctx.form.resetFields(['status', 'remark']);
```

## İlgili Bağlamlar (Context) ile İlişkisi

### ctx.getValue / ctx.setValue

| Senaryo | Önerilen Kullanım |
|------|----------|
| **Mevcut alanı oku/yaz** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Diğer alanları oku/yaz** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Mevcut JS alanı içinde, öncelikle bu alanı okumak/yazmak için `getValue`/`setValue` kullanın; diğer alanlara erişmeniz gerektiğinde `ctx.form` kullanın.

### ctx.blockModel

| Gereksinim | Önerilen Kullanım |
|------|----------|
| **Form alanlarını oku/yaz** | `ctx.form` (`ctx.blockModel?.form` ile eşdeğerdir, daha pratiktir) |
| **Üst bloğa erişim** | `ctx.blockModel` (`koleksiyon`, `kaynak` vb. içerir) |

### ctx.getVar('ctx.formValues')

Form değerleri `await ctx.getVar('ctx.formValues')` aracılığıyla alınmalıdır ve doğrudan `ctx.formValues` olarak sunulmaz. Form bağlamında, en güncel değerleri gerçek zamanlı okumak için `ctx.form.getFieldsValue()` kullanılması tercih edilir.

## Dikkat Edilmesi Gerekenler

- `getFieldsValue()` varsayılan olarak yalnızca işlenen (rendered) alanları döndürür; işlenmeyen alanlar (daraltılmış bölümler veya koşullu gizleme gibi) için `true` parametresi geçilmelidir: `getFieldsValue(true)`.
- Alt tablolar gibi iç içe geçmiş alanların yolu bir dizidir, örneğin `['orders', 0, 'amount']`. Mevcut alan yolunu almak ve aynı satırdaki diğer sütunların yolunu oluşturmak için `ctx.namePath` kullanabilirsiniz.
- `validateFields()` yöntemi, `errorFields` gibi bilgileri içeren bir hata nesnesi fırlatır; gönderim öncesi doğrulama başarısız olduğunda sonraki adımları sonlandırmak için `ctx.exit()` kullanabilirsiniz.
- İş akışları veya bağlantı kuralları gibi asenkron senaryolarda `ctx.form` henüz hazır olmayabilir; isteğe bağlı zincirleme (optional chaining) veya boş değer kontrolü kullanılması önerilir.

## Örnekler

### Alan Bağlantısı: Türe göre farklı içerik gösterme

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Diğer alanlara göre mevcut alanı hesaplama

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Alt tablo içinde aynı satırdaki diğer sütunları oku/yaz

```ts
// ctx.namePath, alanın formdaki yoludur, örn. ['orders', 0, 'amount']
// Aynı satırdaki 'status' değerini oku: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Gönderim Öncesi Doğrulama

```ts
try {
  await ctx.form.validateFields();
  // Doğrulama başarılı, gönderim mantığına devam et
} catch (e) {
  ctx.message.error('Lütfen form alanlarını kontrol edin');
  ctx.exit();
}
```

### Onay Aldıktan Sonra Gönder

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Gönderimi Onayla',
  content: 'Gönderdikten sonra değişiklik yapamazsınız. Devam etmek istiyor musunuz?',
  okText: 'Onayla',
  cancelText: 'İptal',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Kullanıcı iptal ederse sonlandır
}
```

## İlgili

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Mevcut alan değerini okuma ve yazma.
- [ctx.blockModel](./block-model.md): Üst blok modeli; `ctx.form`, `ctx.blockModel?.form` ile eşdeğerdir.
- [ctx.modal](./modal.md): Genellikle `ctx.form.validateFields()` ve `ctx.form.submit()` ile birlikte kullanılan onay pencereleri.
- [ctx.exit()](./exit.md): Doğrulama hatası veya kullanıcı iptali durumunda süreci sonlandırma.
- `ctx.namePath`: Mevcut alanın formdaki yolu (dizi); iç içe geçmiş alanlarda `getFieldValue` / `setFieldValue` için isim oluştururken kullanılır.