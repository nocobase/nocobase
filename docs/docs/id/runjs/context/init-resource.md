:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/init-resource).
:::

# ctx.initResource()

**Menginisialisasi** resource untuk konteks saat ini: Jika `ctx.resource` belum ada, metode ini akan membuat resource dengan tipe yang ditentukan dan mengikatnya ke konteks; jika sudah ada, resource tersebut akan langsung digunakan. Setelah itu, resource dapat diakses melalui `ctx.resource`.

## Skenario Penggunaan

Umumnya hanya digunakan dalam skenario **JSBlock** (blok independen). Sebagian besar blok, popup, dan komponen lainnya sudah memiliki `ctx.resource` yang terikat secara otomatis, sehingga tidak memerlukan pemanggilan manual. JSBlock secara default tidak memiliki resource, sehingga Anda harus memanggil `ctx.initResource(type)` terlebih dahulu sebelum memuat data melalui `ctx.resource`.

## Definisi Tipe

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Tipe | Keterangan |
|-----------|------|-------------|
| `type` | `string` | Tipe resource: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Nilai kembalian**: Instans resource dalam konteks saat ini (yaitu `ctx.resource`).

## Perbedaan dengan ctx.makeResource()

| Metode | Perilaku |
|--------|----------|
| `ctx.initResource(type)` | Membuat dan mengikat jika `ctx.resource` tidak ada; mengembalikan yang sudah ada jika tersedia. Menjamin `ctx.resource` tersedia untuk digunakan. |
| `ctx.makeResource(type)` | Hanya membuat dan mengembalikan instans baru, **tidak** menulis ke `ctx.resource`. Cocok untuk skenario yang membutuhkan beberapa resource independen atau penggunaan sementara. |

## Contoh

### Data Daftar (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Rekaman Tunggal (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Tentukan kunci utama
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Menentukan Sumber Data

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Catatan

- Dalam sebagian besar skenario blok (Formulir, Tabel, Detail, dll.) dan popup, `ctx.resource` sudah terikat sebelumnya oleh lingkungan runtime, sehingga pemanggilan `ctx.initResource` tidak diperlukan.
- Inisialisasi manual hanya diperlukan dalam konteks seperti JSBlock yang secara default tidak memiliki resource.
- Setelah inisialisasi, Anda harus memanggil `setResourceName(name)` untuk menentukan koleksi, lalu memanggil `refresh()` untuk memuat data.

## Terkait

- [ctx.resource](./resource.md) — Instans resource dalam konteks saat ini
- [ctx.makeResource()](./make-resource.md) — Membuat instans resource baru tanpa mengikatnya ke `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Beberapa rekaman/Daftar
- [SingleRecordResource](../resource/single-record-resource.md) — Rekaman tunggal
- [APIResource](../resource/api-resource.md) — Resource API umum
- [SQLResource](../resource/sql-resource.md) — Resource kueri SQL