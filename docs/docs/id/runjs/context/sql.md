---
title: "ctx.sql"
description: "ctx.sql adalah API untuk mengeksekusi SQL mentah, untuk query langsung data source, perhatikan keamanan izin dan injection."
keywords: "ctx.sql,eksekusi SQL,query data,run,runById,runBySQL,RunJS,NocoBase"
---

# ctx.sql

`ctx.sql` menyediakan kemampuan eksekusi dan manajemen SQL, sering digunakan di RunJS (seperti JSBlock, event flow) untuk akses langsung ke database. Mendukung eksekusi SQL sementara, eksekusi template SQL yang sudah disimpan berdasarkan ID, parameter binding, variabel template (`{{ctx.xxx}}`), dan kontrol tipe hasil.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | Laporan statistik kustom, list filter kompleks, query agregasi cross-table |
| **Block Chart** | Menyimpan template SQL untuk menggerakkan data source chart |
| **Event Flow / Linkage** | Mengeksekusi SQL preset untuk mendapatkan data dan berpartisipasi dalam logika selanjutnya |
| **SQLResource** | Digunakan dengan `ctx.initResource('SQLResource')`, untuk skenario seperti list pagination |

> Perhatian: `ctx.sql` mengakses database melalui API `flowSql`, perlu memastikan user saat ini memiliki izin eksekusi data source yang sesuai.

## Penjelasan Izin

| Izin | Method | Deskripsi |
|------|------|------|
| **User yang Login** | `runById` | Eksekusi berdasarkan ID template SQL yang sudah dikonfigurasi |
| **Izin Konfigurasi SQL** | `run`, `save`, `destroy` | Eksekusi SQL sementara, save/update/delete template SQL |

Logika frontend untuk user umum dapat menggunakan `ctx.sql.runById(uid, options)`; saat memerlukan SQL dinamis atau mengelola template, perlu memastikan role saat ini memiliki izin konfigurasi SQL.

## Definisi Tipe

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Method Umum

| Method | Deskripsi | Persyaratan Izin |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Eksekusi SQL sementara, mendukung parameter binding dan variabel template | Perlu izin konfigurasi SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Menyimpan/update template SQL berdasarkan ID untuk digunakan kembali | Perlu izin konfigurasi SQL |
| `ctx.sql.runById(uid, options?)` | Mengeksekusi template SQL yang sudah disimpan berdasarkan ID | Semua user yang login |
| `ctx.sql.destroy(uid)` | Menghapus template SQL dengan ID tertentu | Perlu izin konfigurasi SQL |

Catatan:

- `run` digunakan untuk debugging SQL, perlu izin konfigurasi;
- `save`, `destroy` digunakan untuk mengelola template SQL, perlu izin konfigurasi;
- `runById` terbuka untuk user umum, hanya dapat dieksekusi berdasarkan template yang sudah disimpan, tidak dapat melakukan debugging atau modifikasi SQL;
- Saat ada perubahan template SQL, perlu memanggil `save` untuk menyimpan.

## Penjelasan Parameter

### options run / runById

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `bind` | `Record<string, any>` | Bind variabel. Di SQL menggunakan `$name`, bind meneruskan objek `{ name: value }` |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Tipe hasil: multiple row, single row, single value, default `selectRows` |
| `dataSourceKey` | `string` | Identifier data source, default menggunakan data source utama |
| `filter` | `Record<string, any>` | Kondisi filter tambahan (bergantung pada dukungan interface) |

### options save

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | Identifier unik template, setelah disimpan dapat dieksekusi dengan `runById(uid, ...)` |
| `sql` | `string` | Konten SQL, mendukung variabel template `{{ctx.xxx}}` dan placeholder `$name` |
| `dataSourceKey` | `string` | Opsional, identifier data source |

## Variabel Template SQL dan Parameter Binding

### Variabel Template `{{ctx.xxx}}`

Di SQL dapat menggunakan `{{ctx.xxx}}` untuk mereferensikan variabel konteks, akan di-resolve menjadi nilai aktual sebelum eksekusi:

```js
// Mereferensikan ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Sumber variabel yang dapat direferensikan sama dengan `ctx.getVar()` (seperti `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` kustom, dll.).

### Parameter Binding

- **Parameter**: di SQL menggunakan `$name`, `bind` meneruskan objek `{ name: value }`

```js
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = $status AND age > $minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);
```

## Contoh

### Eksekusi SQL Sementara (Perlu Izin Konfigurasi SQL)

```js
// Hasil multiple row (default)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Hasil single row
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = $id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Hasil single value (seperti COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Menggunakan Variabel Template

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Menyimpan Template dan Menggunakan Kembali

```js
// Save (perlu izin konfigurasi SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = $status ORDER BY created_at DESC',
});

// Semua user yang login dapat mengeksekusi
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Menghapus template (perlu izin konfigurasi SQL)
await ctx.sql.destroy('active-users-report');
```

### List Pagination (SQLResource)

```js
// Saat memerlukan pagination, filter, dapat menggunakan SQLResource
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID template SQL yang sudah disimpan
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Berisi page, pageSize, dll.
```

## Hubungan dengan ctx.resource, ctx.request

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Eksekusi query SQL** | `ctx.sql.run()` atau `ctx.sql.runById()` |
| **List pagination SQL (block)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **HTTP request umum** | `ctx.request()` |

`ctx.sql` membungkus API `flowSql`, khusus untuk skenario SQL; `ctx.request` dapat memanggil API apa pun.

## Hal yang Perlu Diperhatikan

- Gunakan parameter binding (`$name`) bukan penggabungan string, untuk menghindari SQL injection
- Saat `type: 'selectVar'` mengembalikan nilai scalar, biasanya digunakan untuk `COUNT`, `SUM`, dll.
- Variabel template `{{ctx.xxx}}` di-resolve sebelum eksekusi, pastikan variabel yang sesuai sudah didefinisikan dalam konteks

## Terkait

- [ctx.resource](./resource.md): Resource data, SQLResource internal akan memanggil API `flowSql`
- [ctx.initResource()](./init-resource.md): Inisialisasi SQLResource untuk skenario list pagination, dll.
- [ctx.request()](./request.md): HTTP request umum
