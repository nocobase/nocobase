---
title: "ctx.getValue()"
description: "ctx.getValue() mendapatkan nilai field form atau variabel, mendukung path, scope, untuk linkage, kalkulasi, dan validasi."
keywords: "ctx.getValue,field form,path,scope,linkage,kalkulasi,validasi,RunJS,NocoBase"
---

# ctx.getValue()

Pada skenario field yang dapat diedit seperti JSField, JSItem, mendapatkan nilai terbaru dari field saat ini. Bersama dengan `ctx.setValue(v)` dapat mengimplementasikan binding dua arah dengan form.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSField** | Pada field kustom yang dapat diedit, membaca input pengguna atau nilai form saat ini |
| **JSItem** | Pada item yang dapat diedit di tabel/sub-table, membaca nilai sel saat ini |
| **JSColumn** | Saat render kolom tabel, membaca nilai field dari baris yang sesuai |

> Perhatian: `ctx.getValue()` hanya tersedia pada konteks RunJS dengan binding form; pada skenario tanpa field binding seperti event flow, aturan linkage, method ini tidak ada.

## Definisi Tipe

```ts
getValue<T = any>(): T | undefined;
```

- **Return Value**: nilai field saat ini, tipe ditentukan oleh tipe form item field; saat field belum terdaftar atau belum diisi mungkin `undefined`.

## Urutan Pengambilan Nilai

`ctx.getValue()` mengambil nilai dengan urutan berikut:

1. **Status Form**: lebih utamakan membaca dari status saat ini Ant Design Form
2. **Nilai Fallback**: jika field tidak ada di form, kembali ke nilai awal field atau props

> Saat form belum selesai dirender atau field belum terdaftar, mungkin mengembalikan `undefined`.

## Contoh

### Render Berdasarkan Nilai Saat Ini

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Silakan masukkan konten terlebih dahulu</span>);
} else {
  ctx.render(<span>Nilai saat ini: {current}</span>);
}
```

### Bersama dengan setValue Mengimplementasikan Binding Dua Arah

```tsx
const { Input } = ctx.libs.antd;

// Membaca nilai saat ini sebagai default value
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Terkait

- [ctx.setValue()](./set-value.md) - Menyetel nilai field saat ini, bersama dengan `getValue` mengimplementasikan binding dua arah
- [ctx.form](./form.md) - Instance Ant Design Form, dapat membaca/menulis field lain
- `js-field:value-change` - Event container yang dipicu saat nilai berubah dari luar, untuk update tampilan
