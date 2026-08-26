---
title: "RunJS SQLResource"
description: "Resource SQL RunJS: mengeksekusi template SQL atau SQL mentah, setFilterByTk, setSQL, runById, runBySQL, mendukung pagination, cocok untuk laporan, statistik, data source chart."
keywords: "SQLResource,resource SQL,runById,runBySQL,laporan,statistik,RunJS,NocoBase"
---

# SQLResource

Resource yang menjalankan query berdasarkan **konfigurasi SQL yang sudah disimpan** atau **SQL dinamis**, sumber data adalah API seperti `flowSql:run` / `flowSql:runById`. Cocok untuk skenario seperti laporan, statistik, list SQL kustom, dll. Berbeda dengan [MultiRecordResource](./multi-record-resource.md), SQLResource tidak bergantung pada data table, langsung mengeksekusi query SQL, mendukung pagination, parameter binding, variabel template (`{{ctx.xxx}}`), dan kontrol tipe hasil.

**Hubungan Inheritance**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Cara Pembuatan**: `ctx.makeResource('SQLResource')` atau `ctx.initResource('SQLResource')`. Saat dijalankan berdasarkan konfigurasi yang sudah disimpan perlu `setFilterByTk(uid)` (uid template SQL); saat debugging dapat menggunakan `setDebug(true)` + `setSQL(sql)` untuk langsung mengeksekusi SQL; di RunJS `ctx.api` disuntikkan oleh runtime environment.

---

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Laporan / Statistik** | Agregasi kompleks, query cross-table, indikator statistik kustom |
| **List Kustom JSBlock** | Menggunakan SQL untuk implementasi filter, sorting, atau relasi khusus, dan render kustom |
| **Block Chart** | Menyimpan template SQL untuk menggerakkan data source chart, mendukung pagination |
| **Pemilihan dengan ctx.sql** | Saat memerlukan pagination, event, data reaktif gunakan SQLResource; query sekali pakai sederhana dapat menggunakan `ctx.sql.run()` / `ctx.sql.runById()` |

---

## Format Data

- `getData()` mengembalikan format berbeda berdasarkan `setSQLType()`:
  - `selectRows` (default): **array**, hasil multiple row
  - `selectRow`: **objek tunggal**
  - `selectVar`: **nilai scalar** (seperti COUNT, SUM)
- `getMeta()` mengembalikan informasi meta seperti pagination: `page`, `pageSize`, `count`, `totalPage`, dll.

---

## Konfigurasi SQL dan Mode Eksekusi

| Method | Deskripsi |
|------|------|
| `setFilterByTk(uid)` | Menyetel uid template SQL yang akan dieksekusi (sesuai dengan runById, perlu disimpan di management terlebih dahulu) |
| `setSQL(sql)` | Menyetel SQL mentah (hanya digunakan untuk runBySQL pada mode debug `setDebug(true)`) |
| `setSQLType(type)` | Tipe hasil: `'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | Saat true refresh menjalankan `runBySQL()`, jika tidak menjalankan `runById()` |
| `run()` | Memanggil `runBySQL()` atau `runById()` berdasarkan debug |
| `runBySQL()` | Mengeksekusi dengan SQL `setSQL` saat ini (perlu setDebug(true) terlebih dahulu) |
| `runById()` | Mengeksekusi template SQL yang sudah disimpan dengan uid saat ini |

---

## Parameter dan Konteks

| Method | Deskripsi |
|------|------|
| `setBind(bind)` | Bind variabel. Bentuk objek dengan `:name`, bentuk array dengan `?` |
| `setLiquidContext(ctx)` | Konteks template (Liquid), untuk mem-parsing `{{ctx.xxx}}` |
| `setFilter(filter)` | Kondisi filter tambahan (diteruskan ke data request) |
| `setDataSourceKey(key)` | Identifier data source (digunakan pada multi-data-source) |

---

## Pagination

| Method | Deskripsi |
|------|------|
| `setPage(page)` / `getPage()` | Halaman saat ini (default 1) |
| `setPageSize(size)` / `getPageSize()` | Jumlah per halaman (default 20) |
| `next()` / `previous()` / `goto(page)` | Pindah halaman dan memicu refresh |

Di SQL dapat menggunakan `{{ctx.limit}}`, `{{ctx.offset}}` untuk mereferensikan parameter pagination, SQLResource akan menyuntikkan `limit`, `offset` di konteks.

---

## Pengambilan Data dan Event

| Method | Deskripsi |
|------|------|
| `refresh()` | Mengeksekusi SQL (runById atau runBySQL), menulis hasil ke `setData(data)` dan update meta, memicu event `'refresh'` |
| `runAction(actionName, options)` | Memanggil interface dasar (seperti `getBind`, `run`, `runById`) |
| `on('refresh', fn)` / `on('loading', fn)` | Memicu setelah refresh selesai, mulai loading |

---

## Contoh

### Eksekusi Berdasarkan Template yang Sudah Disimpan (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // uid template SQL yang sudah disimpan
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, dll.
```

### Mode Debug: Langsung Mengeksekusi SQL (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Pagination dan Pindah Halaman

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Pindah halaman
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Tipe Hasil

```js
// Multiple row (default)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Single row
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Single value (seperti COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Menggunakan Variabel Template

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Memantau Event refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Hal yang Perlu Diperhatikan

- **runById perlu menyimpan template terlebih dahulu**: uid `setFilterByTk(uid)` harus merupakan ID template SQL yang sudah disimpan di management, dapat disimpan melalui `ctx.sql.save({ uid, sql })`.
- **Mode debug perlu izin**: saat `setDebug(true)` menjalankan `flowSql:run`, perlu role saat ini memiliki izin konfigurasi SQL; `runById` hanya perlu login.
- **Debounce refresh**: dalam event loop yang sama beberapa pemanggilan `refresh()` hanya akan mengeksekusi yang terakhir, untuk menghindari request berulang.
- **Parameter binding mencegah injection**: gunakan `setBind()` dengan placeholder `:name` / `?`, untuk menghindari SQL injection akibat penggabungan string.

---

## Terkait

- [ctx.sql](../context/sql.md) - Eksekusi dan manajemen SQL, `ctx.sql.runById` cocok untuk query sekali pakai sederhana
- [ctx.resource](../context/resource.md) - Instance resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan mengikat ke ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Membuat instance resource baru, tidak mengikat
- [APIResource](./api-resource.md) - API resource umum
- [MultiRecordResource](./multi-record-resource.md) - Berorientasi data table/list
