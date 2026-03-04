:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/resource).
:::

# ctx.resource

Instansi **FlowResource** dalam konteks saat ini, digunakan untuk mengakses dan mengoperasikan data. Pada sebagian besar blok (Formulir, Tabel, Detail, dll.) dan skenario pop-up, lingkungan runtime akan mengikat `ctx.resource` secara otomatis; untuk skenario seperti JSBlock yang secara default tidak memiliki resource, Anda harus memanggil [ctx.initResource()](./init-resource.md) terlebih dahulu untuk inisialisasi sebelum menggunakan `ctx.resource`.

## Skenario Penggunaan

Dapat digunakan dalam skenario RunJS apa pun yang memerlukan akses ke data terstruktur (daftar, rekaman tunggal, API kustom, SQL). Blok Formulir, Tabel, Detail, dan pop-up biasanya sudah terikat secara otomatis; untuk JSBlock, JSField, JSItem, JSColumn, dll., jika perlu memuat data, Anda dapat memanggil `ctx.initResource(type)` terlebih dahulu sebelum mengakses `ctx.resource`.

## Definisi Tipe

```ts
resource: FlowResource | undefined;
```

- Dalam konteks dengan pengikatan otomatis, `ctx.resource` adalah instansi resource yang sesuai;
- Pada skenario seperti JSBlock yang secara default tidak memiliki resource, nilainya adalah `undefined` hingga `ctx.initResource(type)` dipanggil.

## Metode Umum

Metode yang tersedia pada tipe resource yang berbeda (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) sedikit bervariasi. Berikut adalah metode universal atau yang sering digunakan:

| Metode | Keterangan |
|------|------|
| `getData()` | Mendapatkan data saat ini (daftar atau rekaman tunggal) |
| `setData(value)` | Mengatur data lokal |
| `refresh()` | Melakukan permintaan dengan parameter saat ini untuk menyegarkan data |
| `setResourceName(name)` | Mengatur nama sumber daya (misalnya `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Mengatur filter kunci utama (untuk `get` rekaman tunggal, dll.) |
| `runAction(actionName, options)` | Memanggil action sumber daya apa pun (misalnya `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Berlangganan/berhenti berlangganan ke peristiwa (misalnya `refresh`, `saved`) |

**Khusus MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, dll.

## Contoh

### Data Daftar (perlu initResource terlebih dahulu)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Skenario Tabel (sudah terikat otomatis)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Berhasil dihapus'));
```

### Rekaman Tunggal

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Memanggil action kustom

```js
await ctx.resource.runAction('create', { data: { name: 'Budi' } });
```

## Hubungan dengan ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Jika `ctx.resource` belum ada, maka akan dibuat dan diikat; jika sudah ada, akan langsung dikembalikan. Menjamin `ctx.resource` tersedia.
- **ctx.makeResource(type)**: Membuat instansi resource baru dan mengembalikannya, **tidak** menulis ke `ctx.resource`. Cocok untuk skenario yang membutuhkan beberapa resource independen atau penggunaan sementara.
- **ctx.resource**: Mengakses resource yang sudah terikat pada konteks saat ini. Sebagian besar blok/pop-up sudah terikat secara otomatis; jika tidak, nilainya adalah `undefined` dan memerlukan `ctx.initResource`.

## Catatan

- Disarankan untuk melakukan pemeriksaan nilai kosong sebelum penggunaan: `ctx.resource?.refresh()`, terutama pada skenario seperti JSBlock yang mungkin tidak memiliki pengikatan otomatis.
- Setelah inisialisasi, Anda harus memanggil `setResourceName(name)` untuk menentukan koleksi sebelum memuat data melalui `refresh()`.
- Untuk API lengkap dari setiap tipe Resource, silakan lihat tautan di bawah ini.

## Terkait

- [ctx.initResource()](./init-resource.md) - Inisialisasi dan ikat resource ke konteks saat ini
- [ctx.makeResource()](./make-resource.md) - Membuat instansi resource baru tanpa mengikatnya ke `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Beberapa rekaman/Daftar
- [SingleRecordResource](../resource/single-record-resource.md) - Rekaman tunggal
- [APIResource](../resource/api-resource.md) - Sumber daya API umum
- [SQLResource](../resource/sql-resource.md) - Sumber daya kueri SQL