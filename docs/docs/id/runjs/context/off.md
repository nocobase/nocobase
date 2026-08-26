---
title: "ctx.off()"
description: "ctx.off() menghapus event listener yang didaftarkan oleh ctx.on(), untuk cleanup, menghindari listener berulang."
keywords: "ctx.off,ctx.on,event listener,menghapus listener,RunJS,NocoBase"
---

# ctx.off()

Menghapus event listener yang didaftarkan melalui `ctx.on(eventName, handler)`. Sering digunakan dengan [ctx.on](./on.md), unsubscribe pada waktu yang tepat untuk menghindari memory leak atau pemicu berulang.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Cleanup React useEffect** | Memanggil pada cleanup `useEffect`, menghapus listener saat komponen di-unmount |
| **JSField / JSEditableField** | Saat binding dua arah field, membatalkan subscription `js-field:value-change` |
| **Terkait Resource** | Membatalkan subscription listener seperti refresh, saved yang didaftarkan ke `ctx.resource.on` |

## Definisi Tipe

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Contoh

### Penggunaan Berpasangan dalam React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Membatalkan Subscription Resource Event

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Pada waktu yang tepat
ctx.resource?.off('refresh', handler);
```

## Hal yang Perlu Diperhatikan

1. **Konsistensi referensi handler**: `handler` yang diteruskan saat `ctx.off` harus referensi yang sama dengan saat `ctx.on`, jika tidak tidak dapat dihapus dengan benar.
2. **Cleanup tepat waktu**: panggil `ctx.off` sebelum komponen di-unmount atau context dihancurkan, untuk menghindari memory leak.

## Dokumentasi Terkait

- [ctx.on](./on.md) - Subscribe event
- [ctx.resource](./resource.md) - Instance resource dan `on`/`off`-nya
