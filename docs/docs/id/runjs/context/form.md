:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/form).
:::

# ctx.form

Instansi Ant Design Form di dalam blok saat ini, digunakan untuk membaca/menulis field formulir, memicu validasi, dan pengiriman (submission). Ini setara dengan `ctx.blockModel?.form` dan dapat digunakan secara langsung di bawah blok formulir (Form, EditForm, sub-formulir, dll.).

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSField** | Membaca/menulis field formulir lain untuk mengimplementasikan kaitan (linkage), atau melakukan perhitungan dan validasi berdasarkan nilai field lain. |
| **JSItem** | Membaca/menulis field di baris yang sama atau field lainnya dalam item sub-tabel untuk mencapai kaitan di dalam tabel. |
| **JSColumn** | Membaca nilai baris tersebut atau field relasi dalam kolom tabel untuk tujuan perenderan. |
| **Operasi Formulir / Alur Kerja** | Validasi sebelum pengiriman, pembaruan field secara massal, reset formulir, dll. |

> Catatan: `ctx.form` hanya tersedia dalam konteks RunJS yang terkait dengan blok formulir (Form, EditForm, sub-formulir, dll.); dalam skenario non-formulir (seperti blok JSBlock independen atau blok Tabel), instansi ini mungkin tidak ada. Disarankan untuk melakukan pemeriksaan nilai kosong sebelum digunakan: `ctx.form?.getFieldsValue()`.

## Definisi Tipe

```ts
form: FormInstance<any>;
```

`FormInstance` adalah tipe instansi dari Ant Design Form. Metode yang umum digunakan adalah sebagai berikut.

## Metode Umum

### Membaca Nilai Formulir

```ts
// Membaca nilai field yang saat ini terdaftar (default hanya menyertakan field yang dirender)
const values = ctx.form.getFieldsValue();

// Membaca nilai semua field (termasuk field yang terdaftar tetapi tidak dirender, seperti yang tersembunyi atau di dalam area yang dilipat)
const allValues = ctx.form.getFieldsValue(true);

// Membaca satu field tunggal
const email = ctx.form.getFieldValue('email');

// Membaca field bersarang (seperti pada sub-tabel)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Menulis Nilai Formulir

```ts
// Pembaruan massal (sering digunakan untuk kaitan/linkage)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Memperbarui satu field tunggal
ctx.form.setFieldValue('remark', 'Telah diberi catatan');
```

### Validasi dan Pengiriman

```ts
// Memicu validasi formulir
await ctx.form.validateFields();

// Memicu pengiriman formulir
ctx.form.submit();
```

### Reset

```ts
// Reset semua field
ctx.form.resetFields();

// Hanya reset field tertentu
ctx.form.resetFields(['status', 'remark']);
```

## Hubungan dengan Konteks Terkait

### ctx.getValue / ctx.setValue

| Skenario | Penggunaan yang Disarankan |
|------|----------|
| **Membaca/menulis field saat ini** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Membaca/menulis field lain** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Di dalam field JS saat ini, prioritaskan penggunaan `getValue`/`setValue` untuk membaca/menulis field itu sendiri; gunakan `ctx.form` saat perlu mengakses field lain.

### ctx.blockModel

| Kebutuhan | Penggunaan yang Disarankan |
|------|----------|
| **Membaca/menulis field formulir** | `ctx.form` (Setara dengan `ctx.blockModel?.form`, lebih praktis) |
| **Mengakses blok induk** | `ctx.blockModel` (Termasuk `koleksi`, `resource`, dll.) |

### ctx.getVar('ctx.formValues')

Nilai formulir harus diperoleh melalui `await ctx.getVar('ctx.formValues')` dan tidak diekspos secara langsung sebagai `ctx.formValues`. Dalam konteks formulir, lebih disarankan menggunakan `ctx.form.getFieldsValue()` untuk membaca nilai terbaru secara real-time.

## Hal-hal yang Perlu Diperhatikan

- `getFieldsValue()` secara default hanya mengembalikan field yang telah dirender; untuk field yang tidak dirender (seperti di area yang dilipat atau disembunyikan oleh aturan kondisi), perlu mengirimkan parameter `true`: `getFieldsValue(true)`.
- Jalur (path) untuk field bersarang seperti sub-tabel berupa array, contohnya `['orders', 0, 'amount']`; Anda dapat menggunakan `ctx.namePath` untuk mendapatkan jalur field saat ini, yang berguna untuk menyusun jalur kolom lain di baris yang sama.
- `validateFields()` akan melemparkan objek kesalahan yang berisi informasi seperti `errorFields`; jika validasi gagal sebelum pengiriman, Anda dapat menggunakan `ctx.exit()` untuk menghentikan langkah selanjutnya.
- Dalam skenario asinkron seperti alur kerja atau aturan kaitan, `ctx.form` mungkin belum siap, disarankan untuk menggunakan optional chaining atau pemeriksaan nilai kosong.

## Contoh

### Kaitan Field: Menampilkan konten berbeda berdasarkan tipe

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

### Membaca/Menulis Kolom Lain di Baris yang Sama dalam Sub-tabel

```ts
// ctx.namePath adalah jalur field saat ini dalam formulir, misal: ['orders', 0, 'amount']
// Membaca status di baris yang sama: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validasi Sebelum Pengiriman

```ts
try {
  await ctx.form.validateFields();
  // Validasi berhasil, lanjutkan logika pengiriman
} catch (e) {
  ctx.message.error('Mohon periksa kembali isian formulir');
  ctx.exit();
}
```

### Pengiriman Setelah Konfirmasi

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Konfirmasi Pengiriman',
  content: 'Data tidak dapat diubah setelah dikirim, yakin ingin melanjutkan?',
  okText: 'Yakin',
  cancelText: 'Batal',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Berhenti jika pengguna membatalkan
}
```

## Terkait

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Membaca dan menulis nilai field saat ini.
- [ctx.blockModel](./block-model.md): Model blok induk, `ctx.form` setara dengan `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Dialog konfirmasi, sering digunakan bersama dengan `ctx.form.validateFields()` dan `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Menghentikan proses saat validasi gagal atau pengguna membatalkan.
- `ctx.namePath`: Jalur field saat ini dalam formulir (array), digunakan untuk menyusun nama bagi `getFieldValue` / `setFieldValue` pada field bersarang.