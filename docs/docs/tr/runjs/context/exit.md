:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/exit) bakın.
:::

# ctx.exit()

Mevcut olay akışının (event flow) yürütülmesini sonlandırır; sonraki adımlar çalışmaz. Genellikle iş koşulları karşılanmadığında, kullanıcı iptal ettiğinde veya geri dönülemez bir hata oluştuğunda kullanılır.

## Uygulama Senaryoları

`ctx.exit()` genellikle JS yürütülebilen aşağıdaki bağlamlarda kullanılır:

| Senaryo | Açıklama |
|------|------|
| **Olay Akışı** | Form gönderimi, buton tıklaması vb. tarafından tetiklenen olay akışlarında, koşullar sağlanmadığında sonraki adımları sonlandırır. |
| **Etkileşim Kuralları** | Alan etkileşimi, filtre etkileşimi vb. durumlarda, doğrulama başarısız olduğunda veya yürütmenin atlanması gerektiğinde mevcut olay akışını sonlandırır. |
| **İşlem Olayları** | Özel işlemlerde (örneğin silme onayı, kaydetme öncesi doğrulama), kullanıcı iptal ettiğinde veya doğrulama geçmediğinde çıkış yapar. |

> `ctx.exitAll()` ile farkı: `ctx.exit()` yalnızca mevcut olay akışını sonlandırır; aynı olay altındaki diğer olay akışları etkilenmez. `ctx.exitAll()` ise mevcut olay akışını ve aynı olay altında henüz yürütülmemiş olan sonraki olay akışlarını sonlandırır.

## Tür Tanımı

```ts
exit(): never;
```

`ctx.exit()` çağrıldığında, FlowEngine tarafından yakalanan ve mevcut olay akışının yürütülmesini durduran dahili bir `FlowExitException` fırlatılır. Çağrıldıktan sonra, mevcut JS kodundaki kalan ifadeler yürütülmez.

## ctx.exitAll() ile Karşılaştırma

| Yöntem | Etki Kapsamı |
|------|----------|
| `ctx.exit()` | Yalnızca mevcut olay akışını sonlandırır; sonraki olay akışları etkilenmez. |
| `ctx.exitAll()` | Mevcut olay akışını sonlandırır ve aynı olay altında **sıralı olarak yürütülen** sonraki olay akışlarını iptal eder. |

## Örnekler

### Kullanıcı İptal Ettiğinde Çıkış

```ts
// Onay penceresinde, kullanıcı iptal'e tıklarsa olay akışını sonlandır
if (!confirmed) {
  ctx.message.info('İşlem iptal edildi');
  ctx.exit();
}
```

### Parametre Doğrulaması Başarısız Olduğunda Çıkış

```ts
// Doğrulama başarısız olduğunda uyar ve sonlandır
if (!params.value || params.value.length < 3) {
  ctx.message.error('Geçersiz parametreler, uzunluk en az 3 olmalıdır');
  ctx.exit();
}
```

### İş Koşulları Karşılanmadığında Çıkış

```ts
// Koşullar karşılanmazsa sonlandır; sonraki adımlar yürütülmez
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Yalnızca taslaklar gönderilebilir' });
  ctx.exit();
}
```

### ctx.exit() ve ctx.exitAll() Arasında Seçim Yapma

```ts
// Yalnızca mevcut olay akışından çıkılması gerekiyorsa → ctx.exit() kullanın
if (!params.valid) {
  ctx.message.error('Geçersiz parametreler');
  ctx.exit();  // Diğer olay akışları etkilenmez
}

// Mevcut olay altındaki tüm sonraki olay akışlarının sonlandırılması gerekiyorsa → ctx.exitAll() kullanın
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Yetersiz yetki' });
  ctx.exitAll();  // Hem mevcut olay akışı hem de aynı olay altındaki sonraki olay akışları sonlandırılır
}
```

### Modal Onayından Sonra Kullanıcı Seçimine Göre Çıkış

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Silme İşlemini Onayla',
  content: 'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
});
if (!ok) {
  ctx.message.info('İptal edildi');
  ctx.exit();
}
```

## Notlar

- `ctx.exit()` çağrıldıktan sonra, mevcut JS içindeki sonraki kodlar yürütülmez; çağırmadan önce `ctx.message`, `ctx.notification` veya bir modal aracılığıyla kullanıcıya nedenini açıklamanız önerilir.
- İş kodunda genellikle `FlowExitException` hatasını yakalamanıza gerek yoktur; bunu olay akışı motorunun (FlowEngine) işlemesine bırakın.
- Mevcut olay altındaki tüm sonraki olay akışlarını sonlandırmanız gerekiyorsa `ctx.exitAll()` kullanın.

## İlgili

- [ctx.exitAll()](./exit-all.md): Mevcut olay akışını ve aynı olay altındaki sonraki olay akışlarını sonlandırır.
- [ctx.message](./message.md): Mesaj ipuçları.
- [ctx.modal](./modal.md): Onay pencereleri.