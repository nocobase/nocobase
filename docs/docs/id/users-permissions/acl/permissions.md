---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Mengonfigurasi Izin

## Pengaturan Izin Umum

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Izin Konfigurasi

1.  **Mengizinkan konfigurasi antarmuka**: Izin ini mengontrol apakah pengguna dapat mengonfigurasi antarmuka. Setelah diaktifkan, tombol konfigurasi UI akan muncul. Peran "admin" secara default mengaktifkan izin ini.
2.  **Mengizinkan instalasi, aktivasi, penonaktifan plugin**: Izin ini mengontrol apakah pengguna dapat mengaktifkan atau menonaktifkan **plugin**. Setelah diaktifkan, pengguna akan mendapatkan akses ke antarmuka manajer **plugin**. Peran "admin" secara default mengaktifkan izin ini.
3.  **Mengizinkan konfigurasi plugin**: Izin ini memungkinkan pengguna untuk mengonfigurasi parameter **plugin** atau mengelola data backend **plugin**. Peran "admin" secara default mengaktifkan izin ini.
4.  **Mengizinkan penghapusan cache, memulai ulang aplikasi**: Izin ini terkait dengan tugas pemeliharaan sistem seperti membersihkan cache dan memulai ulang aplikasi. Setelah diaktifkan, tombol operasi terkait akan muncul di pusat pribadi. Izin ini dinonaktifkan secara default.
5.  **Item menu baru secara default diizinkan untuk diakses**: Item menu yang baru dibuat secara default dapat diakses, dan pengaturan ini diaktifkan secara default.

### Izin Tindakan Global

Izin tindakan global berlaku secara universal untuk semua **koleksi** dan dikategorikan berdasarkan jenis operasi. Izin ini dapat dikonfigurasi berdasarkan cakupan data: semua data atau data milik pengguna sendiri. Yang pertama memungkinkan operasi pada seluruh **koleksi**, sedangkan yang kedua membatasi operasi hanya pada data yang relevan dengan pengguna.

## Izin Tindakan Koleksi

![](https://static-docs.nocobase.com/6a6e0281939cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Izin tindakan **koleksi** menyempurnakan izin tindakan global, memungkinkan konfigurasi izin akses sumber daya secara individual untuk setiap **koleksi**. Izin ini dibagi menjadi dua aspek:

1.  **Izin tindakan**: Izin tindakan meliputi tindakan menambah, melihat, mengedit, menghapus, mengekspor, dan mengimpor. Izin ini diatur berdasarkan cakupan data:
    *   **Semua data**: Memungkinkan pengguna untuk melakukan tindakan pada semua catatan dalam **koleksi**.
    *   **Data milik sendiri**: Membatasi pengguna untuk melakukan tindakan hanya pada catatan yang mereka buat.

2.  **Izin bidang**: Izin bidang memungkinkan Anda untuk mengatur izin spesifik untuk setiap bidang selama operasi yang berbeda. Misalnya, beberapa bidang dapat dikonfigurasi agar hanya dapat dilihat, tanpa hak pengeditan.

## Izin Akses Menu

Izin akses menu mengontrol akses berdasarkan item menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Izin Konfigurasi Plugin

Izin konfigurasi **plugin** mengontrol kemampuan untuk mengonfigurasi parameter **plugin** tertentu. Ketika diaktifkan, antarmuka manajemen **plugin** yang sesuai akan muncul di pusat admin.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)