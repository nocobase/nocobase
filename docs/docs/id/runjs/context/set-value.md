---
title: "ctx.setValue()"
description: "ctx.setValue() menyetel nilai field form atau variabel, mendukung path, scope, silent, untuk linkage, prefill, update dinamis."
keywords: "ctx.setValue,field form,path,scope,silent,linkage,prefill,RunJS,NocoBase"
---

# ctx.setValue()

Pada skenario field yang dapat diedit seperti JSField, JSItem, menyetel nilai field saat ini. Bersama dengan `ctx.getValue()` dapat mengimplementasikan binding dua arah dengan form.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSField** | Pada field kustom yang dapat diedit, menulis nilai pilihan pengguna atau hasil kalkulasi |
| **JSItem** | Pada item yang dapat diedit di tabel/sub-table, update nilai sel saat ini |
| **JSColumn** | Saat render kolom tabel, update nilai field baris yang sesuai berdasarkan logika |

> Perhatian: `ctx.setValue(v)` hanya tersedia pada konteks RunJS dengan binding form; pada skenario tanpa field binding seperti event flow, aturan linkage, JSBlock, method ini tidak ada, disarankan menggunakan optional chaining: `ctx.setValue?.(value)`.

## Definisi Tipe

```ts
setValue<T = any>(value: T): void;
```

- **Parameter**: `value` adalah nilai field yang akan ditulis, tipe ditentukan oleh tipe form item field.

## Penjelasan Perilaku

- `ctx.setValue(v)` akan update nilai field saat ini di Ant Design Form, dan memicu logika linkage dan validasi form terkait.
- Saat form belum selesai dirender atau field belum terdaftar, pemanggilan mungkin tidak efektif, disarankan dikombinasikan dengan `ctx.getValue()` untuk konfirmasi hasil penulisan.

## Contoh

### Bersama dengan getValue Mengimplementasikan Binding Dua Arah

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

### Menyetel Default Value Berdasarkan Kondisi

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Linkage Field Lain dan Menulis Kembali Field Saat Ini

```ts
// Saat field tertentu berubah, sinkronkan field saat ini
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Kustom', value: 'custom' });
}
```

## Hal yang Perlu Diperhatikan

- Pada field yang tidak dapat diedit (seperti mode detail JSField, JSBlock), `ctx.setValue` mungkin `undefined`, disarankan menggunakan `ctx.setValue?.(value)` untuk menghindari error.
- Saat menyetel nilai untuk field relasi (m2o, o2m, dll.), perlu meneruskan struktur yang sesuai dengan tipe field (seperti `{ id, [titleField]: label }`), bergantung pada konfigurasi field.

## Terkait

- [ctx.getValue()](./get-value.md) - Mendapatkan nilai field saat ini, bersama dengan setValue mengimplementasikan binding dua arah
- [ctx.form](./form.md) - Instance Ant Design Form, dapat membaca/menulis field lain
- `js-field:value-change` - Event container yang dipicu saat nilai berubah dari luar, untuk update tampilan
