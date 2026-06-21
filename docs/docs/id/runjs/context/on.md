---
title: "ctx.on()"
description: "ctx.on() memantau event block atau form, seperti valuesChange, submit, untuk linkage, validasi, logika kustom."
keywords: "ctx.on,event listener,valuesChange,submit,linkage form,RunJS,NocoBase"
---

# ctx.on()

Subscribe event konteks di RunJS (seperti perubahan nilai field, perubahan properti, refresh resource, dll.). Event akan dipetakan berdasarkan tipe ke custom DOM event di `ctx.element` atau event bus internal `ctx.resource`.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSField / JSEditableField** | Memantau nilai field saat berubah dari luar (form, linkage, dll.) untuk sinkronisasi UI, mengimplementasikan binding dua arah |
| **JSBlock / JSItem / JSColumn** | Memantau custom event di container, merespons perubahan data atau status |
| **Terkait Resource** | Memantau event lifecycle seperti refresh, save resource, mengeksekusi logika setelah data diupdate |

## Definisi Tipe

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Event Umum

| Nama Event | Deskripsi | Sumber Event |
|--------|------|----------|
| `js-field:value-change` | Nilai field dimodifikasi dari luar (seperti linkage form, update default value) | CustomEvent di `ctx.element`, `ev.detail` adalah nilai baru |
| `resource:refresh` | Data resource sudah di-refresh | Event bus `ctx.resource` |
| `resource:saved` | Resource selesai disimpan | Event bus `ctx.resource` |

> Aturan pemetaan event akhir: yang diawali dengan `resource:` melalui `ctx.resource.on`, lainnya biasanya melalui DOM event di `ctx.element` (jika ada).

## Contoh

### Binding Dua Arah Field (React useEffect + Cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### DOM Listener Native (Pengganti saat ctx.on Tidak Tersedia)

```ts
// Saat ctx.on tidak disediakan, dapat langsung menggunakan ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Saat cleanup: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Update UI Setelah Resource Refresh

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Update render berdasarkan data
});
```

## Penggunaan Berpasangan dengan ctx.off

- Listener yang didaftarkan dengan `ctx.on` harus dihapus pada waktu yang tepat melalui [ctx.off](./off.md), untuk menghindari memory leak atau pemicu berulang.
- Dalam React, biasanya memanggil `ctx.off` di function cleanup `useEffect`.
- `ctx.off` mungkin tidak ada, disarankan menambahkan optional chaining saat digunakan: `ctx.off?.('eventName', handler)`.

## Hal yang Perlu Diperhatikan

1. **Pembatalan berpasangan**: setiap `ctx.on(eventName, handler)` harus memiliki `ctx.off(eventName, handler)` yang sesuai, dan `handler` yang diteruskan harus referensi yang sama.
2. **Lifecycle**: hapus listener sebelum komponen di-unmount atau context dihancurkan, jika tidak dapat menyebabkan memory leak.
3. **Ketersediaan event**: event yang didukung oleh tipe context yang berbeda berbeda, lihat dokumentasi komponen masing-masing.

## Dokumentasi Terkait

- [ctx.off](./off.md) - Menghapus event listener
- [ctx.element](./element.md) - Container render dan DOM event
- [ctx.resource](./resource.md) - Instance resource dan `on`/`off`-nya
- [ctx.setValue](./set-value.md) - Menyetel nilai field (akan memicu `js-field:value-change`)
