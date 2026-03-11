:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/on) bakın.
:::

# ctx.on()

RunJS'te bağlam olaylarına (alan değeri değişiklikleri, özellik değişiklikleri, kaynak yenilemeleri vb.) abone olun. Olaylar, türlerine göre `ctx.element` üzerindeki özel DOM olaylarına veya `ctx.resource`'un dahili olay veri yoluna (event bus) eşlenir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **JSField / JSEditableField** | Alan değerinin dış kaynaklardan (formlar, bağlantılar vb.) değişmesini dinleyerek UI'yı eşzamanlı olarak günceller ve çift yönlü bağlama (two-way binding) sağlar. |
| **JSBlock / JSItem / JSColumn** | Veri veya durum değişikliklerine yanıt vermek için kapsayıcı üzerindeki özel olayları dinler. |
| **resource ile ilgili** | Veri güncellemelerinden sonra mantık yürütmek için yenileme veya kaydetme gibi kaynak yaşam döngüsü olaylarını dinler. |

## Tür Tanımı

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Yaygın Olaylar

| Olay Adı | Açıklama | Olay Kaynağı |
|--------|------|----------|
| `js-field:value-change` | Alan değeri dışarıdan değiştirildi (örneğin form bağlantısı, varsayılan değer güncellemesi) | `ctx.element` üzerinde `CustomEvent`, `ev.detail` yeni değerdir |
| `resource:refresh` | Kaynak verileri yenilendi | `ctx.resource` olay veri yolu |
| `resource:saved` | Kaynak kaydetme işlemi tamamlandı | `ctx.resource` olay veri yolu |

> Olay eşleme kuralları: `resource:` ön ekiyle başlayan olaylar `ctx.resource.on` üzerinden, diğerleri ise genellikle (varsa) `ctx.element` üzerindeki DOM olayları üzerinden yürütülür.

## Örnekler

### Alan Çift Yönlü Bağlama (React useEffect + Temizlik)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Yerel DOM Dinleme (ctx.on kullanılamadığında alternatif)

```ts
// ctx.on mevcut olmadığında doğrudan ctx.element kullanılabilir
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Temizlik sırasında: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Kaynak Yenileme Sonrası UI Güncelleme

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Veriye göre render işlemini güncelle
});
```

## ctx.off ile Koordinasyon

- `ctx.on` ile kaydedilen dinleyiciler, bellek sızıntılarını veya mükerrer tetiklemeleri önlemek için [ctx.off](./off.md) aracılığıyla uygun zamanda kaldırılmalıdır.
- React'te `ctx.off` genellikle `useEffect`'in temizleme (cleanup) fonksiyonu içinde çağrılır.
- `ctx.off` mevcut olmayabilir; kullanırken isteğe bağlı zincirleme (optional chaining) kullanılması önerilir: `ctx.off?.('eventName', handler)`.

## Dikkat Edilmesi Gerekenler

1. **Eşli İptal**: Her `ctx.on(eventName, handler)` çağrısının karşılık gelen bir `ctx.off(eventName, handler)` çağrısı olmalı ve iletilen `handler` referansı aynı olmalıdır.
2. **Yaşam Döngüsü**: Bellek sızıntılarını önlemek için bileşen kaldırılmadan (unmount) veya bağlam (context) yok edilmeden önce dinleyicileri kaldırın.
3. **Olay Kullanılabilirliği**: Farklı bağlam türleri farklı olayları destekler; ayrıntılar için ilgili bileşen belgelerine bakın.

## İlgili Belgeler

- [ctx.off](./off.md) - Olay dinleyicisini kaldır
- [ctx.element](./element.md) - İşleme kapsayıcısı ve DOM olayları
- [ctx.resource](./resource.md) - Kaynak örneği ve `on`/`off` yöntemleri
- [ctx.setValue](./set-value.md) - Alan değerini ayarla (`js-field:value-change` olayını tetikler)