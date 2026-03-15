:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/resource/sql-resource).
:::

# SQLResource

Resource yang mengeksekusi kueri berdasarkan **konfigurasi SQL yang telah disimpan** atau **SQL dinamis**, dengan sumber data yang berasal dari antarmuka seperti `flowSql:run` / `flowSql:runById`. Resource ini cocok untuk skenario seperti laporan, statistik, daftar SQL kustom, dan lainnya. Berbeda dengan [MultiRecordResource](./multi-record-resource.md), SQLResource tidak bergantung pada koleksi; ia mengeksekusi kueri SQL secara langsung dan mendukung paginasi, pengikatan parameter (parameter binding), variabel templat (`{{ctx.xxx}}`), serta kontrol tipe hasil.

**Hubungan Pewarisan**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Cara Pembuatan**: `ctx.makeResource('SQLResource')` atau `ctx.initResource('SQLResource')`. Untuk mengeksekusi berdasarkan konfigurasi yang telah disimpan, gunakan `setFilterByTk(uid)` (UID dari templat SQL); untuk proses debugging, gunakan `setDebug(true)` + `setSQL(sql)` untuk mengeksekusi SQL secara langsung; dalam RunJS, `ctx.api` disuntikkan oleh lingkungan runtime.

---

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Laporan / Statistik** | Agregasi kompleks, kueri lintas tabel, dan metrik statistik kustom. |
| **Daftar Kustom JSBlock** | Mengimplementasikan penyaringan, pengurutan, atau relasi khusus menggunakan SQL dengan perenderaan kustom. |
| **Blok Diagram (Chart)** | Menggerakkan sumber data diagram dengan templat SQL yang disimpan, mendukung paginasi. |
| **Pemilihan antara SQLResource dan ctx.sql** | Gunakan SQLResource saat membutuhkan paginasi, event, atau data reaktif; gunakan `ctx.sql.run()` / `ctx.sql.runById()` untuk kueri sederhana sekali pakai. |

---

## Format Data

- `getData()` mengembalikan format yang berbeda berdasarkan `setSQLType()`:
  - `selectRows` (default): **Array**, hasil beberapa baris.
  - `selectRow`: **Objek tunggal**.
  - `selectVar`: **Nilai skalar** (seperti COUNT, SUM).
- `getMeta()` mengembalikan informasi meta seperti paginasi: `page`, `pageSize`, `count`, `totalPage`, dll.

---

## Konfigurasi SQL dan Mode Eksekusi

| Metode | Keterangan |
|------|------|
| `setFilterByTk(uid)` | Mengatur UID templat SQL yang akan dieksekusi (sesuai dengan runById, harus disimpan di sisi administrasi terlebih dahulu). |
| `setSQL(sql)` | Mengatur SQL mentah (hanya digunakan untuk runBySQL saat mode debug `setDebug(true)` aktif). |
| `setSQLType(type)` | Tipe hasil: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Jika true, refresh akan menjalankan `runBySQL()`, jika tidak akan menjalankan `runById()`. |
| `run()` | Memanggil `runBySQL()` atau `runById()` berdasarkan status debug. |
| `runBySQL()` | Mengeksekusi menggunakan SQL yang diatur di `setSQL` (memerlukan setDebug(true)). |
| `runById()` | Mengeksekusi templat SQL yang telah disimpan menggunakan UID saat ini. |

---

## Parameter dan Konteks

| Metode | Keterangan |
|------|------|
| `setBind(bind)` | Mengikat variabel. Bentuk objek untuk penggunaan `:name`, bentuk array untuk penggunaan `?`. |
| `setLiquidContext(ctx)` | Konteks templat (Liquid), digunakan untuk mengurai `{{ctx.xxx}}`. |
| `setFilter(filter)` | Kondisi penyaringan tambahan (dikirim ke data permintaan). |
| `setDataSourceKey(key)` | Identifikasi sumber data (digunakan saat terdapat banyak sumber data). |

---

## Paginasi

| Metode | Keterangan |
|------|------|
| `setPage(page)` / `getPage()` | Halaman saat ini (default 1). |
| `setPageSize(size)` / `getPageSize()` | Jumlah data per halaman (default 20). |
| `next()` / `previous()` / `goto(page)` | Berpindah halaman dan memicu refresh. |

Dalam SQL, Anda dapat menggunakan `{{ctx.limit}}` dan `{{ctx.offset}}` untuk mereferensikan parameter paginasi. SQLResource akan menyuntikkan `limit` dan `offset` ke dalam konteks secara otomatis.

---

## Penarikan Data dan Event

| Metode | Keterangan |
|------|------|
| `refresh()` | Mengeksekusi SQL (runById atau runBySQL), menuliskan hasilnya ke `setData(data)` dan memperbarui meta, serta memicu event `'refresh'`. |
| `runAction(actionName, options)` | Memanggil antarmuka dasar (seperti `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Dipicu saat penyegaran selesai atau saat pemuatan dimulai. |

---

## Contoh

### Eksekusi Berdasarkan Templat yang Disimpan (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID templat SQL yang telah disimpan
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, dll.
```

### Mode Debug: Mengeksekusi SQL Secara Langsung (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Paginasi dan Perpindahan Halaman

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Berpindah halaman
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Tipe Hasil

```js
// Banyak baris (default)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Baris tunggal
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Nilai tunggal (seperti COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Menggunakan Variabel Templat

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Mendengarkan Event refresh

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Catatan

- **runById memerlukan penyimpanan templat terlebih dahulu**: UID pada `setFilterByTk(uid)` harus merupakan ID templat SQL yang telah disimpan di sisi administrasi, yang dapat disimpan melalui `ctx.sql.save({ uid, sql })`.
- **Mode debug memerlukan izin**: Saat `setDebug(true)`, proses akan melalui `flowSql:run`, yang mengharuskan peran saat ini memiliki izin konfigurasi SQL; sedangkan `runById` hanya memerlukan status login.
- **Debounce pada refresh**: Pemanggilan `refresh()` beberapa kali dalam satu event loop yang sama hanya akan mengeksekusi pemanggilan terakhir untuk menghindari permintaan berulang.
- **Pengikatan parameter untuk mencegah injeksi**: Gunakan `setBind()` bersama dengan placeholder `:name` / `?` untuk menghindari injeksi SQL akibat penyambungan string (string concatenation).

---

## Terkait

- [ctx.sql](../context/sql.md) - Eksekusi dan manajemen SQL, `ctx.sql.runById` cocok untuk kueri sederhana sekali pakai.
- [ctx.resource](../context/resource.md) - Instans resource dalam konteks saat ini.
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan pengikatan ke ctx.resource.
- [ctx.makeResource()](../context/make-resource.md) - Membuat instans resource baru tanpa pengikatan.
- [APIResource](./api-resource.md) - Resource API umum.
- [MultiRecordResource](./multi-record-resource.md) - Berorientasi pada tabel data/daftar.