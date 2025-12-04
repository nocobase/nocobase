---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Sinkronisasi Data Pengguna

## Pendahuluan

Fitur ini memungkinkan Anda untuk mendaftarkan dan mengelola sumber sinkronisasi data pengguna. Secara default, API HTTP disediakan, dan sumber data lainnya dapat diperluas melalui plugin. Fitur ini mendukung sinkronisasi data ke **koleksi** Pengguna dan Departemen secara default, dan juga dapat diperluas untuk menyinkronkan ke sumber daya target lainnya melalui plugin.

## Pengelolaan Sumber Data dan Sinkronisasi Data

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Jika tidak ada plugin yang menyediakan sumber sinkronisasi data pengguna terinstal, data pengguna dapat disinkronkan menggunakan API HTTP. Lihat [Sumber Data - HTTP API](./sources/api.md).
:::

## Menambahkan Sumber Data

Setelah Anda menginstal plugin yang menyediakan sumber sinkronisasi data pengguna, Anda dapat menambahkan sumber data yang sesuai. Hanya sumber data yang diaktifkan yang akan menampilkan tombol "Sinkronkan" dan "Tugas".

> Contoh: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Menyinkronkan Data

Klik tombol "Sinkronkan" untuk memulai sinkronisasi data.

![](https://static-docs.nocobase.com/202412041055022.png)

Klik tombol "Tugas" untuk melihat status sinkronisasi. Setelah sinkronisasi berhasil, Anda dapat melihat data di daftar Pengguna dan Departemen.

![](https://static-docs.nocobase.com/202412041202337.png)

Untuk tugas sinkronisasi yang gagal, Anda dapat mengklik "Coba Lagi".

![](https://static-docs.nocobase.com/202412041058337.png)

Jika terjadi kegagalan sinkronisasi, Anda dapat memecahkan masalah melalui log sistem. Selain itu, catatan sinkronisasi mentah disimpan di direktori `user-data-sync` di bawah folder log aplikasi.

![](https://static-docs.nocobase.com/202412041205655.png)