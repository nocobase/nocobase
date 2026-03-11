:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Membuat** instance resource baru dan mengembalikannya, **tanpa** menulis atau mengubah `ctx.resource`. Cocok untuk skenario yang membutuhkan beberapa resource independen atau penggunaan sementara.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Beberapa resource** | Memuat beberapa sumber data secara bersamaan (misalnya, daftar pengguna + daftar pesanan), masing-masing menggunakan resource independen. |
| **Kueri sementara** | Kueri satu kali yang dibuang setelah digunakan, tanpa perlu mengikat ke `ctx.resource`. |
| **Data tambahan** | Gunakan `ctx.resource` untuk data utama, dan `makeResource` untuk membuat instance bagi data tambahan. |

Jika Anda hanya membutuhkan satu resource dan ingin mengikatnya ke `ctx.resource`, menggunakan [ctx.initResource()](./init-resource.md) lebih tepat.

## Definisi Tipe

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Tipe | Keterangan |
|------|------|------|
| `resourceType` | `string` | Tipe resource: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Nilai Kembalian**: Instance resource yang baru dibuat.

## Perbedaan dengan ctx.initResource()

| Metode | Perilaku |
|------|------|
| `ctx.makeResource(type)` | Hanya membuat dan mengembalikan instance baru, **tidak** menulis ke `ctx.resource`. Dapat dipanggil berkali-kali untuk mendapatkan beberapa resource independen. |
| `ctx.initResource(type)` | Jika `ctx.resource` tidak ada, maka akan dibuat dan diikat; jika sudah ada, maka akan langsung dikembalikan. Menjamin `ctx.resource` tersedia. |

## Contoh

### Resource tunggal

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource tetap pada nilai aslinya (jika ada)
```

### Beberapa resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Jumlah pengguna: {usersRes.getData().length}</p>
    <p>Jumlah pesanan: {ordersRes.getData().length}</p>
  </div>
);
```

### Kueri sementara

```ts
// Kueri satu kali, tidak mengotori ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Catatan

- Resource yang baru dibuat perlu memanggil `setResourceName(name)` untuk menentukan koleksi, lalu memuat data melalui `refresh()`.
- Setiap instance resource bersifat independen dan tidak memengaruhi satu sama lain; cocok untuk memuat beberapa sumber data secara paralel.

## Terkait

- [ctx.initResource()](./init-resource.md): Inisialisasi dan ikat ke `ctx.resource`
- [ctx.resource](./resource.md): Instance resource dalam konteks saat ini
- [MultiRecordResource](../resource/multi-record-resource) — Banyak rekaman/Daftar
- [SingleRecordResource](../resource/single-record-resource) — Rekaman tunggal
- [APIResource](../resource/api-resource) — Resource API umum
- [SQLResource](../resource/sql-resource) — Resource kueri SQL