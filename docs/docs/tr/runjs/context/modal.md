:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/modal) bakın.
:::

# ctx.modal

Ant Design Modal tabanlı, RunJS içerisinde modal kutularını (bilgi istemleri, onay pencereleri vb.) aktif olarak açmak için kullanılan bir kestirme API'dir. `ctx.viewer` / görünüm sistemi tarafından uygulanır.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField** | Kullanıcı etkileşiminden sonra işlem sonuçlarını, hata mesajlarını veya ikincil onayları görüntülemek için kullanılır. |
| **İş Akışı / İşlem Olayları** | Gönderimden önce onay penceresi açar; kullanıcı iptal ettiğinde `ctx.exit()` aracılığıyla sonraki adımları sonlandırır. |
| **Bağlantı Kuralları** | Doğrulama başarısız olduğunda kullanıcıya açılır pencere ile uyarı vermek için kullanılır. |

> Not: `ctx.modal`, bir görünüm bağlamı olan RunJS ortamlarında (sayfa içindeki JSBlock'lar, iş akışları vb.) kullanılabilir; backend veya UI olmayan bağlamlarda mevcut olmayabilir. Kullanırken opsiyonel zincirleme (optional chaining) yapılması önerilir (`ctx.modal?.confirm?.()`).

## Tür Tanımı

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Kullanıcı Tamam'a tıklarsa true, iptal ederse false döner
};
```

`ModalConfig`, Ant Design `Modal` statik yöntemlerinin yapılandırmasıyla uyumludur.

## Yaygın Yöntemler

| Yöntem | Dönüş Değeri | Açıklama |
|------|--------|------|
| `info(config)` | `Promise<void>` | Bilgi istemi modalı |
| `success(config)` | `Promise<void>` | Başarı bildirimi modalı |
| `error(config)` | `Promise<void>` | Hata bildirimi modalı |
| `warning(config)` | `Promise<void>` | Uyarı bildirimi modalı |
| `confirm(config)` | `Promise<boolean>` | Onay modalı; kullanıcı Tamam'a tıklarsa `true`, iptal ederse `false` döner |

## Yapılandırma Parametreleri

Ant Design `Modal` ile uyumludur, yaygın alanlar şunlardır:

| Parametre | Tür | Açıklama |
|------|------|------|
| `title` | `ReactNode` | Başlık |
| `content` | `ReactNode` | İçerik |
| `okText` | `string` | Tamam butonu metni |
| `cancelText` | `string` | İptal butonu metni (yalnızca `confirm` için) |
| `onOk` | `() => void \| Promise<void>` | Tamam'a tıklandığında yürütülür |
| `onCancel` | `() => void` | İptal'e tıklandığında yürütülür |

## ctx.message ve ctx.openView ile İlişkisi

| Kullanım Amacı | Önerilen Yöntem |
|------|----------|
| **Hafif geçici uyarı** | `ctx.message`, otomatik olarak kaybolur |
| **Bilgi/Başarı/Hata/Uyarı modalı** | `ctx.modal.info` / `success` / `error` / `warning` |
| **İkincil onay (kullanıcı seçimi gerektirir)** | `ctx.modal.confirm`, akışı kontrol etmek için `ctx.exit()` ile birlikte kullanılır |
| **Formlar veya listeler gibi karmaşık etkileşimler** | Özel bir görünüm (sayfa/çekmece/modal) açmak için `ctx.openView` |

## Örnekler

### Basit Bilgi Modalı

```ts
ctx.modal.info({
  title: 'Bilgi',
  content: 'İşlem tamamlandı',
});
```

### Onay Modalı ve Akış Kontrolü

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Silme İşlemini Onayla',
  content: 'Bu kaydı silmek istediğinizden emin misiniz?',
  okText: 'Onayla',
  cancelText: 'İptal',
});
if (!confirmed) {
  ctx.exit();  // Kullanıcı iptal ederse sonraki adımları sonlandır
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### onOk İçeren Onay Modalı

```ts
await ctx.modal.confirm({
  title: 'Gönderimi Onayla',
  content: 'Gönderildikten sonra değişiklik yapılamaz. Devam etmek istiyor musunuz?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Hata Uyarısı

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Başarılı', content: 'İşlem tamamlandı' });
} catch (e) {
  ctx.modal.error({ title: 'Hata', content: e.message });
}
```

## İlgili Konular

- [ctx.message](./message.md): Hafif geçici uyarı, otomatik olarak kaybolur
- [ctx.exit()](./exit.md): Kullanıcı onayı iptal ettiğinde akışı sonlandırmak için yaygın olarak `if (!confirmed) ctx.exit()` şeklinde kullanılır
- [ctx.openView()](./open-view.md): Karmaşık etkileşimler için uygun, özel bir görünüm açar