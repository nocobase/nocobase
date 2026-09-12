---
title: "RunJS MultiRecordResource"
description: "Resource multiple record RunJS: pagination tabel/list, filter, sorting, refresh, create, update, destroy, destroySelectedRows, cocok untuk block tabel, JSBlock list, resource relasi."
keywords: "MultiRecordResource,resource multiple record,pagination,filter,sorting,block tabel,RunJS,NocoBase"
---

# MultiRecordResource

Resource yang berorientasi pada data table: request mengembalikan array, mendukung pagination, filter, sorting, dan CRUD. Cocok untuk skenario "multiple record" seperti tabel, list, dll. Berbeda dengan [APIResource](./api-resource.md), MultiRecordResource menentukan nama resource melalui `setResourceName()`, otomatis membangun URL seperti `users:list`, `users:create`, dan dengan kemampuan pagination, filter, baris terpilih bawaan.

**Hubungan Inheritance**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Cara Pembuatan**: `ctx.makeResource('MultiRecordResource')` atau `ctx.initResource('MultiRecordResource')`. Sebelum digunakan perlu `setResourceName('nama-data-table')` (seperti `'users'`); di RunJS `ctx.api` disuntikkan oleh runtime environment.

---

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Block Tabel** | Block tabel, list secara default menggunakan MultiRecordResource, mendukung pagination, filter, sorting |
| **JSBlock List** | Memuat data data table seperti user, order di JSBlock dan render kustom |
| **Batch Operation** | Mendapatkan baris terpilih melalui `getSelectedRows()`, `destroySelectedRows()` untuk batch delete |
| **Resource Relasi** | Menggunakan bentuk `users.tags` dll. untuk memuat data table relasi, perlu digunakan dengan `setSourceId(ID-record-parent)` |

---

## Format Data

- `getData()` mengembalikan **array record**, yaitu field `data` dari API list
- `getMeta()` mengembalikan informasi meta seperti pagination: `page`, `pageSize`, `count`, `totalPage`, dll.

---

## Nama Resource dan Data Source

| Method | Deskripsi |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nama resource, seperti `'users'`, `'users.tags'` (resource relasi) |
| `setSourceId(id)` / `getSourceId()` | ID record parent saat resource relasi (seperti `users.tags` perlu meneruskan primary key users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifier data source (digunakan pada multi-data-source) |

---

## Parameter Request (Filter / Field / Sorting)

| Method | Deskripsi |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filter primary key (single get, dll.) |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Kondisi filter, mendukung operator seperti `$eq`, `$ne`, `$in`, dll. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Grup filter (kombinasi multi-kondisi) |
| `setFields(fields)` / `getFields()` | Field request (whitelist) |
| `setSort(sort)` / `getSort()` | Sorting, seperti `['-createdAt']` berarti urutan terbalik berdasarkan waktu pembuatan |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Expand relasi (seperti `['user', 'tags']`) |

---

## Pagination

| Method | Deskripsi |
|------|------|
| `setPage(page)` / `getPage()` | Halaman saat ini (mulai dari 1) |
| `setPageSize(size)` / `getPageSize()` | Jumlah per halaman, default 20 |
| `getTotalPage()` | Total halaman |
| `getCount()` | Total record (dari meta server) |
| `next()` / `previous()` / `goto(page)` | Pindah halaman dan memicu `refresh` |

---

## Baris Terpilih (Skenario Tabel)

| Method | Deskripsi |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Data baris yang dipilih saat ini, untuk operasi seperti batch delete |

---

## CRUD dan Operasi List

| Method | Deskripsi |
|------|------|
| `refresh()` | Request list berdasarkan parameter saat ini, update `getData()` dan meta pagination, memicu event `'refresh'` |
| `get(filterByTk)` | Request single, mengembalikan data tersebut (tidak menulis ke getData) |
| `create(data, options?)` | Create, opsional `{ refresh: false }` untuk tidak otomatis refresh, memicu `'saved'` |
| `update(filterByTk, data, options?)` | Update berdasarkan primary key |
| `destroy(target)` | Delete; target dapat berupa primary key, objek baris atau array primary key/baris (batch delete) |
| `destroySelectedRows()` | Menghapus baris yang dipilih saat ini (melempar error saat tidak ada yang terpilih) |
| `setItem(index, item)` | Mengganti data baris tertentu secara lokal (tidak melakukan request) |
| `runAction(actionName, options)` | Memanggil action resource sembarang (seperti action kustom) |

---

## Konfigurasi dan Event

| Method | Deskripsi |
|------|------|
| `setRefreshAction(name)` | Action yang dipanggil saat refresh, default `'list'` |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Konfigurasi request create/update |
| `on('refresh', fn)` / `on('saved', fn)` | Memicu setelah refresh selesai, save |

---

## Contoh

### List Dasar

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filter dan Sorting

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Expand Relasi

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Create dan Pindah Halaman

```js
await ctx.resource.create({ name: 'Andi', email: 'andi@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Batch Delete Baris yang Terpilih

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Silakan pilih data terlebih dahulu');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Sudah dihapus'));
```

### Memantau Event refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Resource Relasi (Sub-Table)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Hal yang Perlu Diperhatikan

- **setResourceName wajib**: sebelum digunakan harus memanggil `setResourceName('nama-data-table')`, jika tidak tidak dapat membangun URL request.
- **Resource relasi**: saat nama resource adalah `parent.child` (seperti `users.tags`), perlu `setSourceId(primary key record parent)` terlebih dahulu.
- **Debounce refresh**: dalam event loop yang sama beberapa pemanggilan `refresh()` hanya akan mengeksekusi yang terakhir, untuk menghindari request berulang.
- **getData adalah array**: `data` yang dikembalikan API list adalah array record, `getData()` langsung mengembalikan array tersebut.

---

## Terkait

- [ctx.resource](../context/resource.md) - Instance resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan mengikat ke ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Membuat instance resource baru, tidak mengikat
- [APIResource](./api-resource.md) - API resource umum, request berdasarkan URL
- [SingleRecordResource](./single-record-resource.md) - Berorientasi single record
