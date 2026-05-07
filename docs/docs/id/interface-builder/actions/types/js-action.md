---
title: "JSAction Action JS"
description: "JSAction Action JS: tombol Action kustom, menjalankan logika JavaScript, mendukung ctx, Form, linkage Block."
keywords: "JSAction, Action JS, Action kustom, JavaScript, interface builder, NocoBase"
---

# JS Action

## Pengantar

JS Action digunakan untuk menjalankan JavaScript saat tombol diklik, mengkustomisasi perilaku bisnis apa pun. Dapat digunakan di lokasi seperti toolbar Form, toolbar Table (level collection), baris Table (level record), dll., untuk mengimplementasikan validasi, prompt, panggilan interface, membuka Popup/drawer, refresh data, dll.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## API Konteks Runtime (Umum)

- `ctx.api.request(options)`: mengirim HTTP request;
- `ctx.openView(viewUid, options)`: membuka view yang sudah dikonfigurasi (drawer/dialog/page);
- `ctx.message` / `ctx.notification`: prompt dan notifikasi global;
- `ctx.t()` / `ctx.i18n.t()`: internasionalisasi;
- `ctx.resource`: resource data konteks level collection (seperti toolbar Table, mencakup `getSelectedRows()`, `refresh()`, dll.);
- `ctx.record`: record baris saat ini di konteks level record (seperti tombol baris Table);
- `ctx.form`: instance AntD Form di konteks level Form (seperti tombol toolbar Form);
- `ctx.collection`: meta info collection saat ini;
- Code editor mendukung snippet `Snippets` dan pre-run `Run` (lihat di bawah).


- `ctx.requireAsync(url)`: load library AMD/UMD secara asynchronous berdasarkan URL;
- `ctx.importAsync(url)`: import modul ESM secara dinamis berdasarkan URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: library umum bawaan seperti React / ReactDOM / Ant Design / icon Ant Design / dayjs / lodash / math.js / formula.js, dll., digunakan untuk render JSX, pemrosesan waktu, operasi data, dan operasi matematika.

> Variabel yang sebenarnya tersedia akan berbeda berdasarkan lokasi tombol, di atas adalah ringkasan kemampuan umum.

## Editor dan Snippet

- `Snippets`: Membuka daftar snippet kode bawaan, dapat dicari dan disisipkan ke posisi cursor saat ini dengan satu klik.
- `Run`: Langsung menjalankan kode saat ini, dan output log eksekusi ke panel `Logs` di bawah; mendukung `console.log/info/warn/error` dan highlight lokasi error.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- Dapat dikombinasikan dengan AI Employee untuk generate/modify script: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Penggunaan Umum (Contoh Ringkas)

### 1) Request Interface dan Prompt

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) Tombol Collection: Validasi Pemilihan dan Pemrosesan

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Jalankan logika bisnis…
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) Tombol Record: Membaca Record Baris Saat Ini

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) Membuka View (Drawer/Dialog)

```js
const popupUid = ctx.model.uid + '-open'; // Bind ke tombol saat ini, jaga stabilitas
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) Refresh Data Setelah Submit

```js
// Refresh umum: prioritaskan resource Table/List, kemudian resource Block tempat Form berada
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```


## Perhatian

- Idempotensi perilaku: hindari multiple submit akibat klik berulang, dapat menambahkan switch state atau menonaktifkan tombol dalam logika.
- Penanganan error: tambahkan try/catch untuk panggilan interface dan berikan prompt pengguna.
- Linkage view: saat membuka Popup/drawer melalui `ctx.openView`, disarankan untuk meneruskan parameter secara eksplisit, jika perlu refresh resource parent secara aktif setelah submit berhasil.

## Dokumentasi Terkait

- [Variabel dan Konteks](/interface-builder/variables)
- [Aturan Linkage](/interface-builder/linkage-rule)
- [View dan Popup](/interface-builder/actions/types/view)
