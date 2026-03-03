:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/message) bakın.
:::

# ctx.message

Ant Design global message API'si, sayfanın üst orta kısmında geçici hafif ipuçları görüntülemek için kullanılır. Mesajlar belirli bir süre sonra otomatik olarak kapanır veya kullanıcı tarafından manuel olarak kapatılabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | İşlem geri bildirimi, doğrulama uyarıları, kopyalama başarısı gibi hafif ipuçları |
| **Form İşlemleri / İş Akışı** | Gönderim başarısı, kaydetme hatası, doğrulama başarısızlığı gibi geri bildirimler |
| **İşlem Etkinlikleri (JSAction)** | Tıklamalar, toplu işlem tamamlamaları vb. için anlık geri bildirimler |

## Tür Tanımı

```ts
message: MessageInstance;
```

`MessageInstance`, aşağıdaki yöntemleri sağlayan Ant Design message arayüzüdür.

## Yaygın Yöntemler

| Yöntem | Açıklama |
|------|------|
| `success(content, duration?)` | Başarı uyarısı görüntüler |
| `error(content, duration?)` | Hata uyarısı görüntüler |
| `warning(content, duration?)` | Uyarı mesajı görüntüler |
| `info(content, duration?)` | Bilgi mesajı görüntüler |
| `loading(content, duration?)` | Yükleme uyarısı görüntüler (manuel olarak kapatılmalıdır) |
| `open(config)` | Özel yapılandırma kullanarak bir mesaj açar |
| `destroy()` | Görüntülenen tüm mesajları kapatır |

**Parametreler:**

- `content` (`string` \| `ConfigOptions`): Mesaj içeriği veya yapılandırma nesnesi
- `duration` (`number`, isteğe bağlı): Otomatik kapanma gecikmesi (saniye), varsayılan 3 saniyedir; otomatik kapanmayı devre dışı bırakmak için 0 olarak ayarlayın

**ConfigOptions** (`content` bir nesne olduğunda):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Mesaj içeriği
  duration?: number;        // Otomatik kapanma gecikmesi (saniye)
  onClose?: () => void;    // Kapatıldığında tetiklenen geri çağırma
  icon?: React.ReactNode;  // Özel simge
}
```

## Örnekler

### Temel Kullanım

```ts
ctx.message.success('İşlem başarılı');
ctx.message.error('İşlem başarısız');
ctx.message.warning('Lütfen önce veriyi seçin');
ctx.message.info('İşleniyor...');
```

### ctx.t ile Uluslararasılaştırma

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Yükleme (loading) ve Manuel Kapatma

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Asenkron işlemi yürüt
await saveData();
hide();  // Yükleme uyarısını manuel olarak kapat
ctx.message.success(ctx.t('Saved'));
```

### open ile Özel Yapılandırma Kullanımı

```ts
ctx.message.open({
  type: 'success',
  content: 'Özel başarı uyarısı',
  duration: 5,
  onClose: () => console.log('mesaj kapatıldı'),
});
```

### Tüm Mesajları Kapatma

```ts
ctx.message.destroy();
```

## ctx.message ve ctx.notification Arasındaki Fark

| Özellik | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Konum** | Sayfanın üst orta kısmı | Sağ üst köşe |
| **Kullanım Amacı** | Geçici hafif ipucu, otomatik olarak kaybolur | Bildirim paneli, başlık ve açıklama içerebilir, daha uzun süreli gösterim için uygundur |
| **Tipik Senaryolar** | İşlem geri bildirimi, doğrulama uyarıları, kopyalama başarısı | Görev tamamlama bildirimleri, sistem mesajları, kullanıcının dikkatini gerektiren daha uzun içerikler |

## İlgili

- [ctx.notification](./notification.md) - Sağ üst köşe bildirimleri, daha uzun süreli gösterimler için uygundur
- [ctx.modal](./modal.md) - Modal onayı, engelleyici etkileşim
- [ctx.t()](./t.md) - Uluslararasılaştırma, genellikle message ile birlikte kullanılır