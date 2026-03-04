:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/off).
:::

# ctx.off()

Menghapus *event listener* yang didaftarkan melalui `ctx.on(eventName, handler)`. Fungsi ini sering digunakan bersama dengan [ctx.on](./on.md) untuk membatalkan langganan (*unsubscribe*) pada waktu yang tepat, guna menghindari kebocoran memori atau pemicu ganda.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Pembersihan (Cleanup) React useEffect** | Dipanggil dalam fungsi *cleanup* `useEffect` untuk menghapus *listener* saat komponen dilepas (*unmount*). |
| **JSField / JSEditableField** | Membatalkan langganan ke `js-field:value-change` selama pengikatan data dua arah (*two-way data binding*) untuk *field*. |
| **Terkait resource** | Membatalkan langganan *listener* seperti `refresh`, `saved`, dan lainnya yang didaftarkan melalui `ctx.resource.on`. |

## Definisi Tipe

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Contoh

### Penggunaan berpasangan dalam React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Membatalkan langganan event resource

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Pada waktu yang tepat
ctx.resource?.off('refresh', handler);
```

## Catatan Penting

1. **Referensi handler yang konsisten**: `handler` yang diberikan ke `ctx.off` harus merupakan referensi yang sama dengan yang digunakan pada `ctx.on`; jika tidak, *listener* tidak dapat dihapus dengan benar.
2. **Pembersihan tepat waktu**: Panggil `ctx.off` sebelum komponen dilepas (*unmount*) atau *context* dihancurkan untuk menghindari kebocoran memori.

## Dokumen Terkait

- [ctx.on](./on.md) - Berlangganan event
- [ctx.resource](./resource.md) - Instansi resource serta metode `on`/`off` miliknya