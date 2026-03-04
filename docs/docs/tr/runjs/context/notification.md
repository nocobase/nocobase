:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/notification) bakın.
:::

# ctx.notification

Ant Design Notification tabanlı bu global bildirim API'si, sayfanın **sağ üst köşesinde** bildirim panelleri görüntülemek için kullanılır. `ctx.message` ile karşılaştırıldığında, bildirimler başlık ve açıklama içerebilir; bu da onları daha uzun süre görüntülenmesi gereken veya kullanıcının dikkatini gerektiren içerikler için uygun hale getirir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSBlock / İşlem Etkinlikleri** | Görev tamamlama bildirimleri, toplu işlem sonuçları, dışa aktarma tamamlanması vb. |
| **İş Akışı (FlowEngine)** | Asenkron süreçler sona erdiğinde sistem düzeyinde uyarılar. |
| **Daha uzun süre görüntülenmesi gereken içerikler** | Başlık, açıklama ve işlem düğmeleri içeren tam bildirimler. |

## Tip Tanımı

```ts
notification: NotificationInstance;
```

`NotificationInstance`, aşağıdaki yöntemleri sağlayan Ant Design bildirim arayüzüdür.

## Yaygın Yöntemler

| Yöntem | Açıklama |
|------|------|
| `open(config)` | Özel yapılandırma ile bir bildirim açar |
| `success(config)` | Başarı türünde bir bildirim görüntüler |
| `info(config)` | Bilgi türünde bir bildirim görüntüler |
| `warning(config)` | Uyarı türünde bir bildirim görüntüler |
| `error(config)` | Hata türünde bir bildirim görüntüler |
| `destroy(key?)` | Belirtilen anahtara (key) sahip bildirimi kapatır; anahtar verilmezse tüm bildirimleri kapatır |

**Yapılandırma Parametreleri** ([Ant Design notification](https://ant.design/components/notification) ile uyumludur):

| Parametre | Tür | Açıklama |
|------|------|------|
| `message` | `ReactNode` | Bildirim başlığı |
| `description` | `ReactNode` | Bildirim açıklaması |
| `duration` | `number` | Otomatik kapatma gecikmesi (saniye). Varsayılan 4,5 saniyedir; otomatik kapatmayı devre dışı bırakmak için 0 olarak ayarlayın |
| `key` | `string` | Bildirimin benzersiz kimliği, belirli bir bildirimi kapatmak için `destroy(key)` ile kullanılır |
| `onClose` | `() => void` | Bildirim kapatıldığında tetiklenen geri çağırma işlevi |
| `placement` | `string` | Konum: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Örnekler

### Temel Kullanım

```ts
ctx.notification.open({
  message: 'İşlem başarılı',
  description: 'Veriler sunucuya kaydedildi.',
});
```

### Türe Göre Kısayol Çağrıları

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Özel Süre ve Anahtar (Key)

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Otomatik kapatma kapalı
});

// Görev tamamlandığında manuel olarak kapat
ctx.notification.destroy('task-123');
```

### Tüm Bildirimleri Kapat

```ts
ctx.notification.destroy();
```

## ctx.message ile Farkları

| Özellik | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Konum** | Sayfanın üst orta kısmı | Sağ üst köşe (yapılandırılabilir) |
| **Yapı** | Tek satırlık hafif ipucu | Başlık + Açıklama içerebilir |
| **Kullanım Amacı** | Geçici geri bildirim, otomatik kaybolur | Tam bildirim, uzun süre görüntülenebilir |
| **Tipik Senaryolar** | İşlem başarılı, doğrulama hatası, kopyalama başarılı | Görev tamamlama, sistem mesajları, kullanıcının dikkatini gerektiren uzun içerikler |

## İlgili Sayfalar

- [ctx.message](./message.md) - Hızlı geri bildirim için uygun, üst kısımda hafif ipucu
- [ctx.modal](./modal.md) - Modal onayı, engelleyici etkileşim
- [ctx.t()](./t.md) - Uluslararasılaştırma, genellikle bildirimlerle birlikte kullanılır