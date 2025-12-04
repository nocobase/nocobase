---
pkg: "@nocobase/plugin-client"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Manajer Rute

## Pendahuluan

Manajer rute adalah alat untuk mengelola rute halaman utama sistem, mendukung perangkat `desktop` dan `mobile`. Rute yang dibuat menggunakan manajer rute akan secara otomatis ditampilkan di menu (dapat dikonfigurasi untuk tidak ditampilkan). Sebaliknya, menu yang ditambahkan melalui menu halaman juga akan otomatis muncul di daftar manajer rute.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Panduan Penggunaan

### Jenis Rute

Sistem mendukung empat jenis rute:

- Grup (`group`): Digunakan untuk mengelola rute dengan mengelompokkannya, dan dapat berisi sub-rute.
- Halaman (`page`): Halaman internal sistem.
- Tab (`tab`): Digunakan untuk beralih antar tab di dalam halaman.
- Tautan (`link`): Tautan internal atau eksternal, dapat langsung mengarahkan ke alamat tautan yang telah dikonfigurasi.

### Menambahkan Rute

Klik tombol "Add new" di pojok kanan atas untuk membuat rute baru:

1. Pilih jenis rute (`Type`)
2. Isi judul rute (`Title`)
3. Pilih ikon rute (`Icon`)
4. Atur apakah akan ditampilkan di menu (`Show in menu`)
5. Atur apakah akan mengaktifkan tab halaman (`Enable page tabs`)
6. Untuk jenis halaman, sistem akan secara otomatis membuat jalur rute (`Path`) yang unik.

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Aksi Rute

Setiap entri rute mendukung aksi-aksi berikut:

- Add child: Menambahkan sub-rute
- Edit: Mengedit konfigurasi rute
- View: Melihat halaman rute
- Delete: Menghapus rute

### Aksi Massal

Bilah alat di bagian atas menyediakan fungsi aksi massal berikut:

- Refresh: Menyegarkan daftar rute
- Delete: Menghapus rute yang dipilih
- Hide in menu: Menyembunyikan rute yang dipilih dari menu
- Show in menu: Menampilkan rute yang dipilih di menu

### Filter Rute

Gunakan fungsi "Filter" di bagian atas untuk menyaring daftar rute sesuai kebutuhan.

:::info{title=Catatan}
Perubahan pada konfigurasi rute akan secara langsung memengaruhi struktur menu navigasi sistem. Harap berhati-hati saat melakukan operasi ini dan pastikan konfigurasi rute sudah benar.
:::