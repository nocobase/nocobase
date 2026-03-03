:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/filter-manager).
:::

# ctx.filterManager

Manajer Koneksi Filter, digunakan untuk mengelola hubungan filter antara formulir filter (FilterForm) dan blok data (tabel, daftar, bagan, dll.). Fitur ini disediakan oleh `BlockGridModel` dan hanya tersedia dalam konteksnya (seperti blok formulir filter, blok data).

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Blok Formulir Filter** | Mengelola konfigurasi koneksi antara item filter dan blok target; menyegarkan data target saat filter berubah. |
| **Blok Data (Tabel/Daftar)** | Bertindak sebagai target yang difilter, mengikat kondisi filter melalui `bindToTarget`. |
| **Aturan Hubungan / FilterModel Kustom** | Memanggil `refreshTargetsByFilter` di dalam `doFilter` atau `doReset` untuk memicu penyegaran target. |
| **Konfigurasi Bidang Koneksi** | Menggunakan `getConnectFieldsConfig` dan `saveConnectFieldsConfig` untuk memelihara pemetaan bidang antara filter dan target. |

> Catatan: `ctx.filterManager` hanya tersedia dalam konteks RunJS yang memiliki `BlockGridModel` (misalnya, di dalam halaman yang berisi formulir filter); bernilai `undefined` pada JSBlock biasa atau halaman independen. Disarankan untuk menggunakan *optional chaining* sebelum mengaksesnya.

## Definisi Tipe

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID model filter
  targetId: string;   // UID model blok data target
  filterPaths?: string[];  // Jalur bidang dari blok target
  operator?: string;  // Operator filter
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Metode Umum

| Metode | Keterangan |
|------|------|
| `getFilterConfigs()` | Mendapatkan semua konfigurasi koneksi filter saat ini. |
| `getConnectFieldsConfig(filterId)` | Mendapatkan konfigurasi bidang koneksi untuk filter tertentu. |
| `saveConnectFieldsConfig(filterId, config)` | Menyimpan konfigurasi bidang koneksi untuk sebuah filter. |
| `addFilterConfig(config)` | Menambahkan konfigurasi filter (filterId + targetId + filterPaths). |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Menghapus konfigurasi filter berdasarkan filterId, targetId, atau keduanya. |
| `bindToTarget(targetId)` | Mengikat konfigurasi filter ke blok target, memicu `resource`-nya untuk menerapkan filter. |
| `unbindFromTarget(targetId)` | Melepas ikatan filter dari blok target. |
| `refreshTargetsByFilter(filterId | filterId[])` | Menyegarkan data blok target terkait berdasarkan filter. |

## Konsep Inti

- **FilterModel**: Model yang menyediakan kondisi filter (misalnya, FilterFormItemModel), yang harus mengimplementasikan `getFilterValue()` untuk mengembalikan nilai filter saat ini.
- **TargetModel**: Blok data yang difilter; `resource`-nya harus mendukung `addFilterGroup`, `removeFilterGroup`, dan `refresh`.

## Contoh

### Menambahkan Konfigurasi Filter

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Menyegarkan Blok Target

```ts
// Di dalam doFilter / doReset pada formulir filter
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Menyegarkan target yang terkait dengan beberapa filter
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Konfigurasi Bidang Koneksi

```ts
// Mendapatkan konfigurasi koneksi
const config = ctx.filterManager?.getConnectFieldsConfig(ctx.model.uid);

// Menyimpan konfigurasi koneksi
await ctx.filterManager?.saveConnectFieldsConfig(ctx.model.uid, {
  targets: [
    { targetId: 'table-uid', filterPaths: ['status'] },
    { targetId: 'chart-uid', filterPaths: ['category'] },
  ],
});
```

### Menghapus Konfigurasi

```ts
// Menghapus semua konfigurasi untuk filter tertentu
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Menghapus semua konfigurasi filter untuk target tertentu
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Terkait

- [ctx.resource](./resource.md): Resource blok target harus mendukung antarmuka filter.
- [ctx.model](./model.md): Digunakan untuk mendapatkan UID model saat ini untuk filterId / targetId.