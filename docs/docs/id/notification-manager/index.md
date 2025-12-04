---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Manajemen Notifikasi

## Pendahuluan

Manajemen Notifikasi adalah layanan terpusat yang mengintegrasikan berbagai metode notifikasi multi-saluran. Layanan ini menyediakan konfigurasi saluran, manajemen pengiriman, dan pencatatan log yang terpadu, serta mendukung perluasan yang fleksibel.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Bagian Ungu**: Manajemen Notifikasi, menyediakan layanan manajemen yang komprehensif, mencakup konfigurasi saluran dan pencatatan log, dengan opsi untuk memperluas ke saluran notifikasi tambahan.
- **Bagian Hijau**: Pesan Dalam Aplikasi (In-App Message), saluran bawaan yang memungkinkan pengguna menerima notifikasi langsung di dalam aplikasi.
- **Bagian Merah**: Email, saluran yang dapat diperluas, memungkinkan pengguna menerima notifikasi melalui email.

## Manajemen Saluran

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Saluran yang saat ini didukung:

- [Pesan Dalam Aplikasi](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (menggunakan transportasi SMTP bawaan)

Anda juga dapat memperluas ke lebih banyak saluran notifikasi. Lihat dokumentasi [Ekstensi Saluran](/notification-manager/development/extension).

## Log Notifikasi

Sistem mencatat informasi dan status terperinci untuk setiap notifikasi, memfasilitasi analisis dan pemecahan masalah.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Node Notifikasi Alur Kerja

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)