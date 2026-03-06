:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/off) bakın.
:::

# ctx.off()

`ctx.on(eventName, handler)` aracılığıyla kaydedilen olay dinleyicilerini kaldırır. Bellek sızıntılarını veya mükerrer tetiklemeleri önlemek için uygun zamanda aboneliği iptal etmek amacıyla genellikle [ctx.on](./on.md) ile birlikte kullanılır.

## Kullanım Senaryoları

| Senaryo | Açıklama |
|------|------|
| **React useEffect Temizliği** | Bileşen kaldırıldığında (unmount) dinleyicileri kaldırmak için `useEffect` temizleme (cleanup) fonksiyonu içinde çağrılır. |
| **JSField / JSEditableField** | Alanlar için çift yönlü veri bağlama sırasında `js-field:value-change` aboneliğini iptal eder. |
| **Kaynak (Resource) ile İlgili** | `ctx.resource.on` aracılığıyla kaydedilen `refresh` veya `saved` gibi dinleyicilerin aboneliğini iptal eder. |

## Tür Tanımı

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Örnekler

### React useEffect İçinde Birlikte Kullanım

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Kaynak Olayları Aboneliğini İptal Etme

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Uygun bir zamanda
ctx.resource?.off('refresh', handler);
```

## Dikkat Edilmesi Gerekenler

1. **Tutarlı handler referansı**: `ctx.off`'a iletilen `handler`, `ctx.on` kullanılırken iletilenle aynı referansa sahip olmalıdır; aksi takdirde dinleyici doğru şekilde kaldırılamaz.
2. **Zamanında temizlik**: Bellek sızıntılarını önlemek için bileşen kaldırılmadan veya bağlam (context) yok edilmeden önce `ctx.off` fonksiyonunu çağırın.

## İlgili Belgeler

- [ctx.on](./on.md) - Olaylara abone olma
- [ctx.resource](./resource.md) - Kaynak örneği ve `on`/`off` metotları