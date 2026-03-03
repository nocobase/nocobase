:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/get-var).
:::

# ctx.getVar()

Membaca nilai variabel secara **asinkron** dari konteks runtime saat ini. Resolusi variabel konsisten dengan `{{ctx.xxx}}` dalam SQL dan templat, biasanya berasal dari pengguna saat ini, rekaman saat ini, parameter tampilan, konteks popup, dll.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock / JSField** | Mendapatkan informasi tentang rekaman saat ini, pengguna, sumber daya, dll., untuk perenderan atau logika. |
| **Aturan Keterkaitan / Alur Kerja** | Membaca `ctx.record`, `ctx.formValues`, dll., untuk logika kondisi. |
| **Formula / Templat** | Menggunakan aturan resolusi variabel yang sama dengan `{{ctx.xxx}}`. |

## Definisi Tipe

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Tipe | Keterangan |
|------|------|------|
| `path` | `string` | Jalur variabel; **harus dimulai dengan `ctx.`**. Mendukung notasi titik dan indeks array. |

**Nilai Kembalian**: `Promise<any>`. Gunakan `await` untuk mendapatkan nilai yang diurai; mengembalikan `undefined` jika variabel tidak ada.

> Jika jalur yang dimasukkan tidak dimulai dengan `ctx.`, kesalahan akan muncul: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Jalur Variabel Umum

| Jalur | Keterangan |
|------|------|
| `ctx.record` | Rekaman saat ini (tersedia saat blok formulir/detail terikat ke rekaman) |
| `ctx.record.id` | Kunci utama (primary key) rekaman saat ini |
| `ctx.formValues` | Nilai formulir saat ini (umum digunakan dalam aturan keterkaitan dan alur kerja; dalam skenario formulir, lebih disarankan menggunakan `ctx.form.getFieldsValue()` untuk pembacaan waktu nyata) |
| `ctx.user` | Pengguna yang sedang login |
| `ctx.user.id` | ID pengguna saat ini |
| `ctx.user.nickname` | Nama panggilan pengguna saat ini |
| `ctx.user.roles.name` | Nama peran pengguna saat ini (array) |
| `ctx.popup.record` | Rekaman di dalam popup |
| `ctx.popup.record.id` | Kunci utama rekaman di dalam popup |
| `ctx.urlSearchParams` | Parameter kueri URL (diurai dari `?key=value`) |
| `ctx.token` | Token API saat ini |
| `ctx.role` | Peran saat ini |

## ctx.getVarInfos()

Mendapatkan **informasi struktural** (tipe, judul, sub-properti, dll.) dari variabel yang dapat diurai dalam konteks saat ini, memudahkan eksplorasi jalur yang tersedia. Nilai yang dikembalikan adalah deskripsi statis berdasarkan `meta` dan tidak menyertakan nilai runtime aktual.

### Definisi Tipe

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Dalam nilai kembalian, setiap key adalah jalur variabel, dan value adalah informasi struktural untuk jalur tersebut (termasuk `type`, `title`, `properties`, dll.).

### Parameter

| Parameter | Tipe | Keterangan |
|------|------|------|
| `path` | `string \| string[]` | Jalur pemotongan; hanya mengumpulkan struktur variabel di bawah jalur ini. Mendukung `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; array mewakili penggabungan beberapa jalur. |
| `maxDepth` | `number` | Kedalaman ekspansi maksimum, default adalah `3`. Jika `path` tidak diberikan, properti tingkat atas memiliki `depth=1`. Jika `path` diberikan, simpul yang sesuai dengan jalur tersebut memiliki `depth=1`. |

### Contoh

```ts
// Mendapatkan struktur variabel di bawah record (diekspansi hingga 3 tingkat)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Mendapatkan struktur dari popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Mendapatkan struktur variabel tingkat atas yang lengkap (default maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Perbedaan dengan ctx.getValue

| Metode | Skenario | Keterangan |
|------|----------|------|
| `ctx.getValue()` | Bidang yang dapat diedit seperti JSField atau JSItem | Mendapatkan nilai **bidang saat ini** secara sinkron; memerlukan pengikatan formulir. |
| `ctx.getVar(path)` | Konteks RunJS apa pun | Mendapatkan **variabel ctx apa pun** secara asinkron; jalur harus dimulai dengan `ctx.`. |

Dalam JSField, gunakan `getValue`/`setValue` untuk membaca/menulis bidang saat ini; gunakan `getVar` untuk mengakses variabel konteks lainnya (seperti `record`, `user`, `formValues`).

## Catatan

- **Jalur harus dimulai dengan `ctx.`**: misal, `ctx.record.id`, jika tidak, kesalahan akan muncul.
- **Metode asinkron**: Anda harus menggunakan `await` untuk mendapatkan hasil, misal, `const id = await ctx.getVar('ctx.record.id')`.
- **Variabel tidak ada**: Mengembalikan `undefined`. Anda dapat menggunakan `??` setelah hasil untuk menetapkan nilai default: `(await ctx.getVar('ctx.user.nickname')) ?? 'Tamu'`.
- **Nilai formulir**: `ctx.formValues` harus diambil melalui `await ctx.getVar('ctx.formValues')`; ini tidak diekspos secara langsung sebagai `ctx.formValues`. Dalam konteks formulir, lebih disarankan menggunakan `ctx.form.getFieldsValue()` untuk membaca nilai terbaru secara waktu nyata.

## Contoh

### Mendapatkan ID Rekaman Saat Ini

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Rekaman saat ini: ${recordId}`);
}
```

### Mendapatkan Rekaman di Dalam Popup

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Rekaman popup saat ini: ${recordId}`);
}
```

### Membaca Sub-item dari Bidang Array

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Mengembalikan array nama peran, misal, ['admin', 'member']
```

### Menetapkan Nilai Default

```ts
// getVar tidak memiliki parameter defaultValue; gunakan ?? setelah hasil
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Tamu';
```

### Membaca Nilai Bidang Formulir

```ts
// Baik ctx.formValues maupun ctx.form adalah untuk skenario formulir; gunakan getVar untuk membaca bidang bersarang
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Membaca Parameter Kueri URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Sesuai dengan ?id=xxx
```

### Mengeksplorasi Variabel yang Tersedia

```ts
// Mendapatkan struktur variabel di bawah record (diekspansi hingga 3 tingkat)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars terlihat seperti { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Terkait

- [ctx.getValue()](./get-value.md) - Mendapatkan nilai bidang saat ini secara sinkron (hanya JSField/JSItem)
- [ctx.form](./form.md) - Instans formulir; `ctx.form.getFieldsValue()` dapat membaca nilai formulir secara waktu nyata
- [ctx.model](./model.md) - Model tempat konteks eksekusi saat ini berada
- [ctx.blockModel](./block-model.md) - Blok induk tempat JS saat ini berada
- [ctx.resource](./resource.md) - Instans sumber daya (resource) dalam konteks saat ini
- `{{ctx.xxx}}` dalam SQL / Templat - Menggunakan aturan resolusi yang sama dengan `ctx.getVar('ctx.xxx')`