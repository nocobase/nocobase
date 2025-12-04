---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Banyak-ke-Banyak (Array)

## Pendahuluan

Fitur ini memungkinkan Anda menggunakan kolom array dalam koleksi data untuk menyimpan beberapa kunci unik dari tabel target, sehingga menciptakan relasi banyak-ke-banyak antara kedua tabel. Sebagai contoh, pertimbangkan entitas Artikel dan Tag. Sebuah artikel dapat dihubungkan ke beberapa tag, dengan tabel artikel menyimpan ID dari catatan yang sesuai dari tabel tag dalam sebuah kolom array.

:::warning{title=Perhatian}

- Sebisa mungkin, disarankan untuk menggunakan koleksi perantara untuk membangun relasi [banyak-ke-banyak](../data-modeling/collection-fields/associations/m2m/index.md) standar, daripada mengandalkan metode ini.
- Saat ini, hanya PostgreSQL yang mendukung pemfilteran data koleksi sumber menggunakan kolom dari tabel target untuk relasi banyak-ke-banyak yang dibuat dengan kolom array. Sebagai contoh, dalam skenario di atas, Anda dapat memfilter artikel berdasarkan kolom lain di tabel tag, seperti judul.

  :::

### Konfigurasi Kolom

![konfigurasi kolom banyak-ke-banyak (array)](https://static-docs.nocobase.com/202407051108180.png)

## Deskripsi Parameter

### Koleksi sumber

Koleksi sumber, yaitu koleksi tempat kolom ini berada.

### Koleksi target

Koleksi target, yaitu koleksi yang memiliki relasi.

### Kunci asing (Foreign key)

Kolom array di koleksi sumber yang menyimpan kunci target dari tabel target.

Hubungan yang sesuai untuk tipe kolom array adalah sebagai berikut:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Kunci target (Target key)

Kolom di koleksi target yang sesuai dengan nilai yang disimpan dalam kolom array koleksi sumber. Kolom ini harus unik.