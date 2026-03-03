:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/on).
:::

# ctx.on()

Berlangganan ke event konteks (seperti perubahan nilai field, perubahan properti, penyegaran sumber daya, dll.) di RunJS. Event dipetakan ke event DOM kustom pada `ctx.element` atau event bus internal dari `ctx.resource` berdasarkan tipenya.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSField / JSEditableField** | Mendengarkan perubahan nilai field dari sumber eksternal (formulir, keterkaitan, dll.) untuk memperbarui UI secara sinkron, mencapai pengikatan dua arah (two-way binding). |
| **JSBlock / JSItem / JSColumn** | Mendengarkan event kustom pada kontainer untuk menanggapi perubahan data atau status. |
| **Terkait resource** | Mendengarkan event siklus hidup sumber daya seperti penyegaran atau penyimpanan untuk mengeksekusi logika setelah pembaruan data. |

## Definisi Tipe

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Event Umum

| Nama Event | Keterangan | Sumber Event |
|--------|------|----------|
| `js-field:value-change` | Nilai field diubah secara eksternal (misalnya, keterkaitan formulir, pembaruan nilai default) | CustomEvent pada `ctx.element`, di mana `ev.detail` adalah nilai baru |
| `resource:refresh` | Data sumber daya telah disegarkan | Event bus `ctx.resource` |
| `resource:saved` | Penyimpanan sumber daya selesai | Event bus `ctx.resource` |

> Aturan pemetaan event: Event dengan awalan `resource:` akan melalui `ctx.resource.on`, sementara yang lain biasanya melalui event DOM pada `ctx.element` (jika ada).

## Contoh

### Pengikatan Dua Arah Field (React useEffect + Pembersihan)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Pendengaran DOM Native (Alternatif saat ctx.on tidak tersedia)

```ts
// Ketika ctx.on tidak tersedia, Anda dapat menggunakan ctx.element secara langsung
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Saat pembersihan: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Memperbarui UI Setelah Penyegaran Sumber Daya

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Perbarui perenderan berdasarkan data
});
```

## Koordinasi dengan ctx.off

- Listener yang didaftarkan menggunakan `ctx.on` harus dihapus pada waktu yang tepat melalui [ctx.off](./off.md) untuk menghindari kebocoran memori atau pemicu ganda.
- Di React, `ctx.off` biasanya dipanggil di dalam fungsi pembersihan (cleanup) `useEffect`.
- `ctx.off` mungkin tidak tersedia; disarankan untuk menggunakan optional chaining: `ctx.off?.('eventName', handler)`.

## Catatan

1. **Pembatalan Berpasangan**: Setiap `ctx.on(eventName, handler)` harus memiliki `ctx.off(eventName, handler)` yang sesuai, dan referensi `handler` yang diberikan harus identik.
2. **Siklus Hidup**: Hapus listener sebelum komponen dilepas (unmount) atau konteks dihancurkan untuk mencegah kebocoran memori.
3. **Ketersediaan Event**: Jenis konteks yang berbeda mendukung event yang berbeda. Silakan merujuk ke dokumentasi komponen spesifik untuk detailnya.

## Dokumentasi Terkait

- [ctx.off](./off.md) - Menghapus listener event
- [ctx.element](./element.md) - Kontainer perenderan dan event DOM
- [ctx.resource](./resource.md) - Instansi sumber daya dan metode `on`/`off`-nya
- [ctx.setValue](./set-value.md) - Mengatur nilai field (memicu `js-field:value-change`)