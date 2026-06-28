---
title: "Table"
description: "Table: Menampilkan daftar, memilih baris, dan mengurutkan baris dengan drag di halaman pengaturan."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` digunakan untuk menampilkan daftar, memilih baris, dan mengurutkan baris dengan drag di halaman pengaturan.



## Penggunaan dasar

```tsx file="../_demos/table.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Identitas baris wajib |
| `showIndex` | `boolean` | Tampilkan indeks baris sebelum pilihan |
| `isDraggable` | `boolean` | Apakah pengurutan drag diaktifkan |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Dipanggil setelah pengurutan drag selesai |
| `showSortHandle` | `boolean` | Apakah menampilkan pegangan drag default |
| `sortHandleColumnWidth` | `number` | Lebar kolom pegangan drag otomatis |

## Ekspor tambahan

| Deskripsi | Deskripsi |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Tautan terkait

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
