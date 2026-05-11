---
title: "ctx.getVar()"
description: "ctx.getVar() mendapatkan nilai variabel yang didefinisikan di workflow atau aturan linkage, mendukung scope."
keywords: "ctx.getVar,variabel,variabel workflow,scope,aturan linkage,RunJS,NocoBase"
---

# ctx.getVar()

Membaca nilai variabel **secara async** dari konteks runtime saat ini. Sumber variabel sama dengan resolusi `{{ctx.xxx}}` di SQL, template, biasanya berasal dari user saat ini, record saat ini, parameter view, konteks popup, dll.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock / JSField** | Mendapatkan informasi seperti record, user, resource saat ini untuk render atau penilaian logika |
| **Aturan Linkage / Event Flow** | Membaca `ctx.record`, `ctx.formValues`, dll. untuk penilaian kondisi |
| **Formula / Template** | Menggunakan aturan resolusi variabel yang sama dengan `{{ctx.xxx}}` |

## Definisi Tipe

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `path` | `string` | Path variabel, **harus dimulai dengan `ctx.`**, mendukung akses titik dan indeks array |

**Return Value**: `Promise<any>`, perlu menggunakan `await` untuk mendapatkan nilai yang sudah di-resolve; mengembalikan `undefined` saat variabel tidak ada.

> Jika meneruskan path yang tidak dimulai dengan `ctx.`, akan melempar error: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Path Variabel Umum

| Path | Deskripsi |
|------|------|
| `ctx.record` | Record saat ini (tersedia saat form/detail terikat record) |
| `ctx.record.id` | Primary key record saat ini |
| `ctx.formValues` | Nilai form saat ini (sering digunakan pada aturan linkage, event flow; pada skenario form lebih utamakan `ctx.form.getFieldsValue()` untuk membaca real-time) |
| `ctx.user` | User yang sedang login |
| `ctx.user.id` | ID user saat ini |
| `ctx.user.nickname` | Nickname user saat ini |
| `ctx.user.roles.name` | Nama role user saat ini (array) |
| `ctx.popup.record` | Record dalam popup |
| `ctx.popup.record.id` | Primary key record dalam popup |
| `ctx.urlSearchParams` | Parameter query URL (di-parse dari `?key=value`) |
| `ctx.token` | API Token saat ini |
| `ctx.role` | Role saat ini |

## ctx.getVarInfos()

Mendapatkan **informasi struktur** variabel yang dapat di-resolve dalam konteks saat ini (tipe, judul, sub-properti, dll.), untuk eksplorasi path yang tersedia. Return value adalah deskripsi statis berbasis `meta`, tidak termasuk nilai runtime aktual.

### Definisi Tipe

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Setiap key di return value adalah path variabel, value adalah informasi struktur yang sesuai dengan path tersebut (berisi `type`, `title`, `properties`, dll.).

### Parameter

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `path` | `string \| string[]` | Path pemotongan, hanya mengumpulkan struktur variabel di bawah path tersebut. Mendukung `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; array berarti gabungan beberapa path |
| `maxDepth` | `number` | Level maksimum yang di-expand, default `3`. Saat tidak meneruskan path properti tingkat atas depth=1; saat meneruskan path, node yang sesuai dengan path memiliki depth=1 |

### Contoh

```ts
// Mendapatkan struktur variabel di bawah record (maksimal expand 3 level)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Mendapatkan struktur popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Mendapatkan struktur variabel tingkat atas yang lengkap (default maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Perbedaan dengan ctx.getValue

| Method | Skenario Penggunaan | Deskripsi |
|------|----------|------|
| `ctx.getValue()` | Field yang dapat diedit seperti JSField, JSItem | Mendapatkan nilai **field saat ini** secara sinkron, perlu binding form |
| `ctx.getVar(path)` | Konteks RunJS apa pun | Mendapatkan **variabel ctx apa pun** secara async, path perlu dimulai dengan `ctx.` |

Pada JSField, gunakan `getValue`/`setValue` untuk membaca/menulis field ini; gunakan `getVar` untuk mengakses variabel konteks lain (seperti record, user, formValues).

## Hal yang Perlu Diperhatikan

- **path harus dimulai dengan `ctx.`**: seperti `ctx.record.id`, jika tidak akan melempar error.
- **Method async**: harus menggunakan `await` untuk mendapatkan hasil, seperti `const id = await ctx.getVar('ctx.record.id')`.
- **Variabel tidak ada**: mengembalikan `undefined`, dapat menggunakan `??` setelah hasil untuk menyetel default value: `(await ctx.getVar('ctx.user.nickname')) ?? 'Tamu'`.
- **Nilai form**: `ctx.formValues` perlu didapatkan melalui `await ctx.getVar('ctx.formValues')`, tidak diekspos langsung sebagai `ctx.formValues`. Pada konteks form lebih utamakan `ctx.form.getFieldsValue()` untuk membaca nilai terbaru secara real-time.

## Contoh

### Mendapatkan ID Record Saat Ini

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Record saat ini: ${recordId}`);
}
```

### Mendapatkan Record dalam Popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Record popup saat ini: ${recordId}`);
}
```

### Membaca Sub-Item Field Array

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Mengembalikan array nama role, seperti ['admin', 'member']
```

### Menyetel Default Value

```ts
// getVar tidak memiliki parameter defaultValue, dapat menggunakan ?? setelah hasil
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Tamu';
```

### Membaca Nilai Field Form

```ts
// ctx.formValues sama dengan ctx.form pada skenario form, dapat menggunakan getVar untuk membaca field nested
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Membaca Parameter Query URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // sesuai dengan ?id=xxx
```

### Eksplorasi Variabel yang Tersedia

```ts
// Mendapatkan struktur variabel di bawah record (maksimal expand 3 level)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars seperti { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Terkait

- [ctx.getValue()](./get-value.md) - Mendapatkan nilai field saat ini secara sinkron (hanya JSField/JSItem, dll.)
- [ctx.form](./form.md) - Instance form, `ctx.form.getFieldsValue()` dapat membaca nilai form secara real-time
- [ctx.model](./model.md) - Model dalam konteks eksekusi saat ini
- [ctx.blockModel](./block-model.md) - Parent block tempat JS saat ini berada
- [ctx.resource](./resource.md) - Instance resource dalam konteks saat ini
- `{{ctx.xxx}}` di SQL / Template - Menggunakan aturan resolusi yang sama dengan `ctx.getVar('ctx.xxx')`
