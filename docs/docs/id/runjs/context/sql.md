:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/sql).
:::

# ctx.sql

`ctx.sql` menyediakan kemampuan eksekusi dan manajemen SQL, yang sering digunakan dalam RunJS (seperti JSBlock dan alur kerja) untuk mengakses database secara langsung. Mendukung eksekusi SQL sementara, eksekusi templat SQL yang disimpan berdasarkan ID, pengikatan parameter (parameter binding), variabel templat (`{{ctx.xxx}}`), serta kontrol tipe hasil.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock** | Laporan statistik kustom, daftar filter kompleks, dan kueri agregasi lintas tabel. |
| **Blok Bagan** | Menyimpan templat SQL untuk menggerakkan sumber data bagan. |
| **Alur Kerja / Kaitan** | Mengeksekusi SQL prasetel untuk mengambil data dan berpartisipasi dalam logika berikutnya. |
| **SQLResource** | Digunakan bersama dengan `ctx.initResource('SQLResource')` untuk skenario seperti daftar bernomor halaman (pagination). |

> Catatan: `ctx.sql` mengakses database melalui API `flowSql`. Pastikan pengguna saat ini memiliki izin eksekusi untuk sumber data yang sesuai.

## Penjelasan Izin

| Izin | Metode | Keterangan |
|------|------|------|
| **Pengguna Terautentikasi** | `runById` | Mengeksekusi berdasarkan ID templat SQL yang telah dikonfigurasi. |
| **Izin Konfigurasi SQL** | `run`, `save`, `destroy` | Mengeksekusi SQL sementara, atau menyimpan/memperbarui/menghapus templat SQL. |

Logika frontend yang ditujukan untuk pengguna umum harus menggunakan `ctx.sql.runById(uid, options)`. Jika diperlukan SQL dinamis atau manajemen templat, pastikan peran saat ini memiliki izin konfigurasi SQL.

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

## Metode Umum

| Metode | Keterangan | Persyaratan Izin |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Mengeksekusi SQL sementara; mendukung pengikatan parameter dan variabel templat. | Izin Konfigurasi SQL |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Menyimpan atau memperbarui templat SQL berdasarkan ID untuk digunakan kembali. | Izin Konfigurasi SQL |
| `ctx.sql.runById(uid, options?)` | Mengeksekusi templat SQL yang telah disimpan sebelumnya berdasarkan ID-nya. | Semua pengguna terautentikasi |
| `ctx.sql.destroy(uid)` | Menghapus templat SQL tertentu berdasarkan ID. | Izin Konfigurasi SQL |

Catatan:

- `run` digunakan untuk men-debug SQL dan memerlukan izin konfigurasi.
- `save` dan `destroy` digunakan untuk mengelola templat SQL dan memerlukan izin konfigurasi.
- `runById` terbuka untuk pengguna umum; hanya dapat mengeksekusi templat yang telah disimpan dan tidak dapat men-debug atau mengubah SQL.
- Jika ada perubahan pada templat SQL, `save` harus dipanggil untuk menyimpan perubahan tersebut.

## Penjelasan Parameter

### options untuk run / runById

| Parameter | Tipe | Keterangan |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Variabel pengikat. Gunakan bentuk objek untuk `:name`, dan bentuk array untuk `?`. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Tipe hasil: banyak baris, satu baris, atau nilai tunggal. Defaultnya adalah `selectRows`. |
| `dataSourceKey` | `string` | Identifikasi sumber data, default menggunakan sumber data utama. |
| `filter` | `Record<string, any>` | Kondisi penyaringan tambahan (tergantung pada dukungan antarmuka). |

### options untuk save

| Parameter | Tipe | Keterangan |
|------|------|------|
| `uid` | `string` | Identifikasi unik untuk templat, setelah disimpan dapat dieksekusi melalui `runById(uid, ...)`. |
| `sql` | `string` | Konten SQL, mendukung variabel templat `{{ctx.xxx}}` dan placeholder `:name` / `?`. |
| `dataSourceKey` | `string` | Opsional, identifikasi sumber data. |

## Variabel Templat SQL dan Pengikatan Parameter

### Variabel Templat `{{ctx.xxx}}`

Dalam SQL, Anda dapat menggunakan `{{ctx.xxx}}` untuk mereferensikan variabel konteks, yang akan diurai menjadi nilai aktual sebelum eksekusi:

```js
// Mereferensikan ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

Sumber variabel yang dapat direferensikan sama dengan `ctx.getVar()` (misalnya `ctx.user.*`, `ctx.record.*`, `ctx.defineProperty` kustom, dll.).

### Pengikatan Parameter (Parameter Binding)

- **Parameter Bernama**: Gunakan `:name` dalam SQL, dan teruskan objek `{ name: value }` pada `bind`.
- **Parameter Posisi**: Gunakan `?` dalam SQL, dan teruskan array `[value1, value2]` pada `bind`.

```js
// Parameter bernama
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Parameter posisi
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Jakarta', 'active'], type: 'selectVar' }
);
```

## Contoh

### Mengeksekusi SQL Sementara (Memerlukan Izin Konfigurasi SQL)

```js
// Hasil banyak baris (default)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Hasil satu baris
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Hasil nilai tunggal (seperti COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Menggunakan Variabel Templat

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Menyimpan Templat dan Menggunakannya Kembali

```js
// Simpan (Memerlukan Izin Konfigurasi SQL)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Semua pengguna terautentikasi dapat mengeksekusinya
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Hapus templat (Memerlukan Izin Konfigurasi SQL)
await ctx.sql.destroy('active-users-report');
```

### Daftar Bernomor Halaman (SQLResource)

```js
// Gunakan SQLResource saat diperlukan penomoran halaman atau penyaringan
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID templat SQL yang telah disimpan
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Termasuk page, pageSize, dll.
```

## Hubungan dengan ctx.resource dan ctx.request

| Kegunaan | Penggunaan yang Disarankan |
|------|----------|
| **Mengeksekusi Kueri SQL** | `ctx.sql.run()` atau `ctx.sql.runById()` |
| **Daftar Bernomor Halaman SQL (Blok)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Permintaan HTTP Umum** | `ctx.request()` |

`ctx.sql` membungkus API `flowSql` dan dikhususkan untuk skenario SQL; `ctx.request` dapat digunakan untuk memanggil API apa pun.

## Catatan

- Gunakan pengikatan parameter (`:name` / `?`) alih-alih penyambungan string untuk menghindari injeksi SQL.
- `type: 'selectVar'` mengembalikan nilai skalar, biasanya digunakan untuk `COUNT`, `SUM`, dll.
- Variabel templat `{{ctx.xxx}}` diurai sebelum eksekusi; pastikan variabel terkait telah didefinisikan dalam konteks.

## Terkait

- [ctx.resource](./resource.md): Sumber data; SQLResource memanggil API `flowSql` secara internal.
- [ctx.initResource()](./init-resource.md): Menginisialisasi SQLResource untuk daftar bernomor halaman, dll.
- [ctx.request()](./request.md): Permintaan HTTP umum.