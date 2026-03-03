:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

Resource yang berorientasi pada tabel data (koleksi): permintaan mengembalikan array, mendukung paginasi, penyaringan (filtering), pengurutan (sorting), serta operasi CRUD. Cocok untuk skenario "banyak catatan" seperti tabel dan daftar. Berbeda dengan [APIResource](./api-resource.md), MultiRecordResource menentukan nama resource melalui `setResourceName()`, secara otomatis membangun URL seperti `users:list`, `users:create`, dan memiliki kemampuan bawaan untuk paginasi, penyaringan, serta pemilihan baris.

**Hubungan Pewarisan**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Cara Pembuatan**: `ctx.makeResource('MultiRecordResource')` atau `ctx.initResource('MultiRecordResource')`. Sebelum digunakan, perlu memanggil `setResourceName('nama_koleksi')` (misalnya `'users'`); Dalam RunJS, `ctx.api` diinjeksikan oleh lingkungan proses (runtime).

---

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Blok Tabel** | Blok tabel dan daftar menggunakan MultiRecordResource secara default, mendukung paginasi, penyaringan, dan pengurutan. |
| **Daftar JSBlock** | Memuat data koleksi seperti pengguna atau pesanan dalam JSBlock dan melakukan perenderaan kustom. |
| **Operasi Batch** | Menggunakan `getSelectedRows()` untuk mendapatkan baris yang dipilih, dan `destroySelectedRows()` untuk penghapusan massal. |
| **Resource Asosiasi** | Memuat koleksi terkait menggunakan format seperti `users.tags`, perlu dikombinasikan dengan `setSourceId(ID_catatan_induk)`. |

---

## Format Data

- `getData()` mengembalikan **array catatan**, yaitu field `data` dari antarmuka list.
- `getMeta()` mengembalikan informasi meta seperti paginasi: `page`, `pageSize`, `count`, `totalPage`, dll.

---

## Nama Resource dan Sumber Data

| Metode | Keterangan |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nama resource, seperti `'users'`, `'users.tags'` (resource asosiasi). |
| `setSourceId(id)` / `getSourceId()` | ID catatan induk saat menggunakan resource asosiasi (misalnya `users.tags` memerlukan kunci utama dari users). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifikasi sumber data (digunakan saat terdapat banyak sumber data). |

---

## Parameter Permintaan (Penyaringan / Field / Pengurutan)

| Metode | Keterangan |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Penyaringan berdasarkan kunci utama (untuk get tunggal, dll.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Kondisi penyaringan, mendukung operator seperti `$eq`, `$ne`, `$in`, dll. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Grup penyaringan (untuk kombinasi beberapa kondisi). |
| `setFields(fields)` / `getFields()` | Field yang diminta (whitelist). |
| `setSort(sort)` / `getSort()` | Pengurutan, misalnya `['-createdAt']` untuk urutan menurun berdasarkan waktu pembuatan. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Pemuatan asosiasi (misalnya `['user', 'tags']`). |

---

## Paginasi

| Metode | Keterangan |
|------|------|
| `setPage(page)` / `getPage()` | Halaman saat ini (dimulai dari 1). |
| `setPageSize(size)` / `getPageSize()` | Jumlah data per halaman, default adalah 20. |
| `getTotalPage()` | Total jumlah halaman. |
| `getCount()` | Total jumlah data (berasal dari meta sisi server). |
| `next()` / `previous()` / `goto(page)` | Berpindah halaman dan memicu `refresh`. |

---

## Baris yang Dipilih (Skenario Tabel)

| Metode | Keterangan |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Data baris yang saat ini dipilih, digunakan untuk operasi seperti penghapusan massal. |

---

## CRUD dan Operasi Daftar

| Metode | Keterangan |
|------|------|
| `refresh()` | Meminta daftar (list) sesuai parameter saat ini, memperbarui `getData()` dan meta paginasi, serta memicu event `'refresh'`. |
| `get(filterByTk)` | Meminta data tunggal, mengembalikan data tersebut (tidak menulis ke `getData`). |
| `create(data, options?)` | Membuat data, opsional `{ refresh: false }` agar tidak melakukan penyegaran otomatis, memicu `'saved'`. |
| `update(filterByTk, data, options?)` | Memperbarui data berdasarkan kunci utama. |
| `destroy(target)` | Menghapus data; target dapat berupa kunci utama, objek baris, atau array kunci utama/objek baris (penghapusan massal). |
| `destroySelectedRows()` | Menghapus baris yang saat ini dipilih (melemparkan kesalahan jika tidak ada yang dipilih). |
| `setItem(index, item)` | Mengganti data baris tertentu secara lokal (tidak mengirimkan permintaan ke server). |
| `runAction(actionName, options)` | Memanggil action resource apa pun (misalnya action kustom). |

---

## Konfigurasi dan Event

| Metode | Keterangan |
|------|------|
| `setRefreshAction(name)` | Action yang dipanggil saat penyegaran, default adalah `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Konfigurasi permintaan untuk create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Dipicu setelah penyegaran selesai atau setelah penyimpanan berhasil. |

---

## Contoh

### Daftar Dasar

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Penyaringan dan Pengurutan

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Pemuatan Asosiasi

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Pembuatan dan Paginasi

```js
await ctx.resource.create({ name: 'Budi', email: 'budi@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Penghapusan Massal Baris yang Dipilih

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Silakan pilih data terlebih dahulu');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Berhasil dihapus'));
```

### Mendengarkan Event refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Resource Asosiasi (Sub-tabel)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Catatan Penting

- **setResourceName Wajib Diisi**: Sebelum digunakan, Anda harus memanggil `setResourceName('nama_koleksi')`, jika tidak, URL permintaan tidak dapat dibangun.
- **Resource Asosiasi**: Jika nama resource dalam format `parent.child` (seperti `users.tags`), Anda harus memanggil `setSourceId(kunci_utama_induk)` terlebih dahulu.
- **Debouncing Refresh**: Beberapa pemanggilan `refresh()` dalam siklus event yang sama hanya akan mengeksekusi yang terakhir untuk menghindari permintaan berulang.
- **getData Berupa Array**: Field `data` yang dikembalikan oleh antarmuka list adalah array catatan, dan `getData()` langsung mengembalikan array tersebut.

---

## Terkait

- [ctx.resource](../context/resource.md) - Instans resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan ikat ke ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Membuat instans resource baru tanpa mengikatnya
- [APIResource](./api-resource.md) - Resource API umum, berdasarkan permintaan URL
- [SingleRecordResource](./single-record-resource.md) - Berorientasi pada catatan tunggal