---
pkg: "@nocobase/plugin-field-m2m-array"
title: "Many to Many (Array)"
description: "Menggunakan field array untuk menyimpan beberapa unique key dari Collection target, membangun relasi Many to Many, seperti artikel-tag many to many, tanpa perlu tabel perantara."
keywords: "many to many array,M2M Array,relasi array,BelongsToMany,NocoBase"
---
# Many to Many (Array)

## Pengantar

Mendukung penggunaan field array dalam Collection untuk menyimpan beberapa unique key dari Collection target, sehingga membangun relasi Many to Many dengan Collection target. Contohnya: ada dua entitas artikel dan tag, satu artikel dapat terhubung ke beberapa tag. Dalam Collection artikel, gunakan satu field array untuk menyimpan ID record yang sesuai dari Collection tag.

:::warning{title=Perhatian}

- Sebisa mungkin gunakan tabel perantara untuk membangun relasi [Many to Many](../data-modeling/collection-fields/associations/m2m/index.md) standar, hindari penggunaan tipe relasi ini.
- Untuk relasi Many to Many yang dibangun menggunakan field array, saat ini hanya dengan menggunakan PostgreSQL yang mendukung filter data Collection sumber menggunakan field Collection target. Contohnya: pada contoh di atas, menggunakan field lain dari Collection tag, seperti judul, untuk memfilter artikel.
  :::

### Konfigurasi Field

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Penjelasan Parameter

### Source collection

Collection sumber, yaitu Collection tempat field saat ini berada.

### Target collection

Collection target, dengan Collection mana akan dihubungkan.

### Foreign key

Field array, field di Collection sumber yang menyimpan Target key dari Collection target.

Korespondensi tipe field array:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Field yang sesuai dengan nilai yang disimpan oleh field array Collection sumber, harus memiliki keunikan.
