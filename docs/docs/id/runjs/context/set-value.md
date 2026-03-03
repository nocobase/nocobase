:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/set-value).
:::

# ctx.setValue()

Dalam skenario field yang dapat diedit seperti JSField dan JSItem, metode ini digunakan untuk mengatur nilai field saat ini. Digunakan bersama dengan `ctx.getValue()` untuk mengaktifkan pengikatan dua arah (*two-way binding*) dengan formulir.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSField** | Menulis nilai yang dipilih pengguna atau hasil perhitungan ke dalam field kustom yang dapat diedit. |
| **JSItem** | Memperbarui nilai sel saat ini dalam item tabel/sub-tabel yang dapat diedit. |
| **JSColumn** | Memperbarui nilai field pada baris yang sesuai berdasarkan logika saat perenderan kolom tabel. |

> **Catatan**: `ctx.setValue(v)` hanya tersedia dalam konteks RunJS dengan pengikatan formulir. Metode ini tidak tersedia dalam skenario tanpa pengikatan field, seperti alur kerja (*workflow*), aturan keterkaitan (*linkage rules*), atau JSBlock. Disarankan untuk menggunakan *optional chaining* sebelum penggunaan: `ctx.setValue?.(value)`.

## Definisi Tipe

```ts
setValue<T = any>(value: T): void;
```

- **Parameter**: `value` adalah nilai field yang akan ditulis, tipenya ditentukan oleh tipe item formulir dari field tersebut.

## Perilaku

- `ctx.setValue(v)` akan memperbarui nilai field saat ini dalam Ant Design Form dan memicu logika keterkaitan serta validasi formulir terkait.
- Jika formulir belum selesai dirender atau field belum terdaftar, pemanggilan mungkin tidak efektif. Disarankan untuk menggunakan `ctx.getValue()` untuk mengonfirmasi hasil penulisan.

## Contoh

### Pengikatan dua arah dengan getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Mengatur nilai default berdasarkan kondisi

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Menulis kembali ke field saat ini saat tertaut dengan field lain

```ts
// Memperbarui field saat ini secara sinkron saat field lain berubah
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Kustom', value: 'custom' });
}
```

## Catatan

- Pada field yang tidak dapat diedit (misalnya mode detail JSField, JSBlock), `ctx.setValue` mungkin bernilai `undefined`. Disarankan menggunakan `ctx.setValue?.(value)` untuk menghindari kesalahan.
- Saat mengatur nilai untuk field relasi (M2O, O2M, dll.), Anda perlu memasukkan struktur yang sesuai dengan tipe field (misalnya `{ id, [titleField]: label }`), tergantung pada konfigurasi spesifik field tersebut.

## Terkait

- [ctx.getValue()](./get-value.md) - Mendapatkan nilai field saat ini, digunakan bersama setValue untuk pengikatan dua arah.
- [ctx.form](./form.md) - Instansi Ant Design Form, digunakan untuk membaca atau menulis field lainnya.
- `js-field:value-change` - Peristiwa kontainer yang dipicu saat nilai eksternal berubah, digunakan untuk memperbarui tampilan.