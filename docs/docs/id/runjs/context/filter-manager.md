---
title: "ctx.filterManager"
description: "ctx.filterManager adalah manajer filter, untuk mendapatkan, menyetel, dan memantau kondisi filter pada tabel atau list."
keywords: "ctx.filterManager,filter,filter tabel,filter list,RunJS,NocoBase"
---

# ctx.filterManager

Manajer koneksi filter, untuk mengelola asosiasi filter antara form filter (FilterForm) dan data block (tabel, list, chart, dll.). Disediakan oleh `BlockGridModel`, hanya tersedia dalam konteksnya (seperti block form filter, data block).

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Block Form Filter** | Mengelola konfigurasi koneksi item filter dengan target block, refresh data target saat filter berubah |
| **Data Block (tabel/list)** | Sebagai target yang difilter, mengikat kondisi filter melalui `bindToTarget` |
| **Aturan Linkage / FilterModel Kustom** | Pada `doFilter`, `doReset` memanggil `refreshTargetsByFilter` untuk memicu refresh target |
| **Konfigurasi Field Koneksi** | Menggunakan `getConnectFieldsConfig`, `saveConnectFieldsConfig` untuk memelihara mapping field antara filter dengan target |

> Perhatian: `ctx.filterManager` hanya tersedia pada konteks RunJS yang memiliki `BlockGridModel` (seperti dalam halaman yang berisi form filter); pada JSBlock biasa atau halaman independen adalah `undefined`, disarankan melakukan optional chaining sebelum digunakan.

## Definisi Tipe

```ts
filterManager: FilterManager;

type FilterConfig = {
  filterId: string;   // UID model filter
  targetId: string;   // UID model data block target
  filterPaths?: string[];  // Path field block target
  operator?: string;  // Operator filter
};

type ConnectFieldsConfig = {
  targets: { targetId: string; filterPaths: string[] }[];
};
```

## Method Umum

| Method | Deskripsi |
|------|------|
| `getFilterConfigs()` | Mendapatkan semua konfigurasi koneksi filter saat ini |
| `getConnectFieldsConfig(filterId)` | Mendapatkan konfigurasi field koneksi dari filter tertentu |
| `saveConnectFieldsConfig(filterId, config)` | Menyimpan konfigurasi field koneksi filter |
| `addFilterConfig(config)` | Menambah konfigurasi filter (filterId + targetId + filterPaths) |
| `removeFilterConfig({ filterId?, targetId?, persist? })` | Menghapus konfigurasi filter, berdasarkan filterId atau targetId atau keduanya |
| `bindToTarget(targetId)` | Mengikat konfigurasi filter ke block target, memicu resource-nya menerapkan filter |
| `unbindFromTarget(targetId)` | Melepas binding filter dari block target |
| `refreshTargetsByFilter(filterId atau filterId[])` | Refresh data block target yang terkait berdasarkan filter |

## Konsep Inti

- **FilterModel**: model yang menyediakan kondisi filter (seperti FilterFormItemModel), perlu mengimplementasikan `getFilterValue()` untuk mengembalikan nilai filter saat ini
- **TargetModel**: data block yang difilter, `resource`-nya perlu mendukung `addFilterGroup`, `removeFilterGroup`, `refresh`

## Contoh

### Menambah Konfigurasi Filter

```ts
await ctx.filterManager?.addFilterConfig({
  filterId: 'filter-form-item-uid',
  targetId: 'table-block-uid',
  filterPaths: ['status', 'createdAt'],
  operator: '$eq',
});
```

### Refresh Block Target

```ts
// Pada doFilter / doReset form filter
ctx.filterManager?.refreshTargetsByFilter(ctx.model.uid);

// Refresh target yang terkait dengan beberapa filter
ctx.filterManager?.refreshTargetsByFilter(['filter-1', 'filter-2']);
```

### Konfigurasi Field Koneksi

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
// Menghapus semua konfigurasi dari filter tertentu
await ctx.filterManager?.removeFilterConfig({ filterId: 'filter-uid' });

// Menghapus semua konfigurasi filter dari target tertentu
await ctx.filterManager?.removeFilterConfig({ targetId: 'table-uid' });
```

## Terkait

- [ctx.resource](./resource.md): Resource block target perlu mendukung interface filter
- [ctx.model](./model.md): Mendapatkan UID model saat ini untuk filterId / targetId
