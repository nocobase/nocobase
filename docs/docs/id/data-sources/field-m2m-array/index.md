---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Banyak-ke-banyak (array)"
description: "Menggunakan field array untuk menyimpan beberapa kunci unik dari tabel target guna membuat relasi banyak-ke-banyak, seperti relasi banyak-ke-banyak artikel-tag, tanpa memerlukan tabel perantara."
keywords: "banyak-ke-banyak array,M2M Array,relasi array,BelongsToMany,NocoBase"
---
# Banyak-ke-banyak (array)

## Pengenalan

Mendukung penggunaan field array dalam tabel data untuk menyimpan beberapa kunci unik dari tabel target, sehingga membangun relasi banyak-ke-banyak dengan tabel target. Contoh: terdapat dua entitas, yaitu artikel dan tag. Satu artikel dapat dikaitkan dengan beberapa tag, dan ID dari record terkait pada tabel tag disimpan dalam sebuah field array di tabel artikel.

:::warning{title=Catatan}

- Sedapat mungkin, gunakan tabel perantara untuk membangun relasi [banyak-ke-banyak](../data-modeling/collection-fields/associations/m2m/index.md) standar dan hindari penggunaan jenis relasi ini.
- Untuk relasi banyak-ke-banyak yang dibangun menggunakan field array, saat ini hanya PostgreSQL yang mendukung pemfilteran data tabel sumber berdasarkan field pada tabel target. Contoh: pada contoh di atas, gunakan field lain dari tabel tag, seperti judul, untuk memfilter artikel.
  :::

### Konfigurasi field

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Penjelasan parameter

### Source collection

Tabel sumber, yaitu tabel tempat field saat ini berada.

### Target collection

Tabel target, yaitu tabel yang akan dikaitkan.

### Foreign key

Field array yang menyimpan kunci Target key dari tabel target di dalam tabel sumber.

Pemetaan jenis field array:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Field pada tabel sumber yang sesuai dengan nilai yang disimpan dalam field array, dan harus bersifat unik.
