---
title: "ctx.form"
description: "ctx.form adalah instance Ant Design Form di dalam block saat ini, untuk membaca/menulis field form, validasi, dan submit, setara dengan ctx.blockModel?.form."
keywords: "ctx.form,Ant Design Form,form,validasi,submit,field form,RunJS,NocoBase"
---

# ctx.form

Instance Ant Design Form di dalam block saat ini, untuk membaca/menulis field form, memicu validasi dan submit. Setara dengan `ctx.blockModel?.form`, dapat digunakan langsung pada form block (Form, EditForm, sub-form, dll.).

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSField** | Membaca/menulis field form lain untuk linkage, melakukan kalkulasi atau validasi berdasarkan nilai field lain |
| **JSItem** | Pada item sub-table, membaca/menulis field di baris yang sama atau lainnya, mengimplementasikan linkage dalam tabel |
| **JSColumn** | Pada kolom tabel, membaca nilai field di baris atau relasi untuk render |
| **Action Form / Event Flow** | Validasi sebelum submit, update field secara batch, reset form, dll. |

> Perhatian: `ctx.form` hanya tersedia pada konteks RunJS terkait form block (Form, EditForm, sub-form, dll.); pada skenario non-form (seperti JSBlock independen, table block) mungkin tidak ada, disarankan melakukan pengecekan null sebelum digunakan: `ctx.form?.getFieldsValue()`.

## Definisi Tipe

```ts
form: FormInstance<any>;
```

`FormInstance` adalah tipe instance Ant Design Form, dengan method umum sebagai berikut.

## Method Umum

### Membaca Nilai Form

```ts
// Membaca nilai field yang sudah terdaftar saat ini (default hanya termasuk field yang sudah dirender)
const values = ctx.form.getFieldsValue();

// Membaca nilai semua field (termasuk field yang sudah terdaftar tetapi belum dirender, seperti yang ada di area tersembunyi atau collapsed)
const allValues = ctx.form.getFieldsValue(true);

// Membaca field tunggal
const email = ctx.form.getFieldValue('email');

// Membaca field nested (seperti sub-table)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Menulis Nilai Form

```ts
// Update batch (sering digunakan untuk linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Update field tunggal
ctx.form.setFieldValue('remark', 'Sudah dicatat');
```

### Validasi dan Submit

```ts
// Memicu validasi form
await ctx.form.validateFields();

// Memicu submit form
ctx.form.submit();
```

### Reset

```ts
// Reset semua field
ctx.form.resetFields();

// Reset hanya field tertentu
ctx.form.resetFields(['status', 'remark']);
```

## Hubungan dengan Context Terkait

### ctx.getValue / ctx.setValue

| Skenario | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membaca/menulis field saat ini** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Membaca/menulis field lain** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Pada JS field saat ini, lebih utamakan `getValue`/`setValue` untuk membaca/menulis field ini; gunakan `ctx.form` saat perlu mengakses field lain.

### ctx.blockModel

| Kebutuhan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membaca/menulis field form** | `ctx.form` (setara dengan `ctx.blockModel?.form`, lebih praktis) |
| **Mengakses parent block** | `ctx.blockModel` (berisi `collection`, `resource`, dll.) |

### ctx.getVar('ctx.formValues')

Nilai form perlu didapatkan melalui `await ctx.getVar('ctx.formValues')`, tidak diekspos langsung sebagai `ctx.formValues`. Pada konteks form, lebih utamakan `ctx.form.getFieldsValue()` untuk membaca nilai terbaru secara real-time.

## Hal yang Perlu Diperhatikan

- `getFieldsValue()` secara default hanya mengembalikan field yang sudah dirender; field yang belum dirender (seperti area collapsed, conditional show/hide) perlu meneruskan `true`: `getFieldsValue(true)`.
- Path field nested seperti sub-table adalah array, seperti `['orders', 0, 'amount']`; dapat menggunakan `ctx.namePath` untuk mendapatkan path field saat ini, untuk membangun path kolom lain di baris yang sama.
- `validateFields()` akan melempar error object yang berisi `errorFields` dll.; saat validasi pre-submit gagal dapat menggunakan `ctx.exit()` untuk menghentikan langkah selanjutnya.
- Pada skenario async seperti event flow, aturan linkage, `ctx.form` mungkin belum siap, disarankan menggunakan optional chaining atau pengecekan null.

## Contoh

### Linkage Field: Tampilkan Konten Berbeda Berdasarkan Tipe

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Menghitung Field Saat Ini Berdasarkan Field Lain

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Membaca/Menulis Kolom Lain di Baris yang Sama dalam Sub-Table

```ts
// ctx.namePath adalah path field saat ini di form, seperti ['orders', 0, 'amount']
// Membaca status baris yang sama: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validasi Sebelum Submit

```ts
try {
  await ctx.form.validateFields();
  // Validasi lulus, lanjutkan logika submit
} catch (e) {
  ctx.message.error('Silakan periksa pengisian form');
  ctx.exit();
}
```

### Submit Setelah Konfirmasi

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Konfirmasi submit',
  content: 'Setelah submit tidak dapat dimodifikasi, apakah ingin melanjutkan?',
  okText: 'OK',
  cancelText: 'Batal',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Menghentikan saat pengguna membatalkan
}
```

## Terkait

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Membaca/menulis nilai field saat ini
- [ctx.blockModel](./block-model.md): Model parent block, `ctx.form` setara dengan `ctx.blockModel?.form`
- [ctx.modal](./modal.md): Popup konfirmasi, sering digunakan dengan `ctx.form.validateFields()`, `ctx.form.submit()`
- [ctx.exit()](./exit.md): Menghentikan flow saat validasi gagal atau pengguna membatalkan
- `ctx.namePath`: Path field saat ini di form (array), digunakan untuk membangun name `getFieldValue` / `setFieldValue` saat field nested
