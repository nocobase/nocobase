---
title: "Kontrol versi"
description: "Panduan plugin kontrol versi: membuat versi, memulihkan versi, mengatur retensi, shortcut, dan koleksi pengguna yang ikut disimpan."
keywords: "Kontrol versi,Version control,manajemen operasi,membuat versi,memulihkan versi,NocoBase"
---

# Kontrol versi

Di NocoBase, **Kontrol versi** memungkinkan kamu menyimpan versi aplikasi saat ini yang bisa dipulihkan kembali. Kamu bisa membuat versi secara manual, memulihkan aplikasi ke versi yang sudah disimpan saat diperlukan, dan memakai pengaturan plugin untuk mengatur berapa banyak versi yang disimpan, shortcut yang dipakai, serta koleksi pengguna mana yang ikut disimpan bersama versi tersebut.

Fitur ini bergantung pada [Manajemen Backup](../backup-manager/index.mdx). Jika plugin kontrol versi sudah diaktifkan tetapi sistem masih menampilkan error terkait, pastikan dulu Manajemen Backup juga aktif.

## Membuka plugin

Kamu bisa membukanya dari 「System settings」 → 「Version control」. Tombol kontrol versi juga muncul di bilah atas. Dari sana kamu bisa langsung membuat versi atau membuka daftar versi. Shortcut bawaan untuk membuat versi adalah `Ctrl + K`, dan kamu bisa mengubahnya di tab pengaturan.

![](https://static-docs.nocobase.com/20260526220402.png)

## Membuat versi

Klik 「Create version」, isi deskripsi, lalu simpan. Deskripsi bisa sampai 2000 karakter. Bagian ini cocok untuk mencatat konteks perubahan, misalnya “Menyesuaikan field dan izin alur persetujuan”.

![](https://static-docs.nocobase.com/20260526220510.png)

Setelah kamu mengklik simpan, daftar akan menampilkan entri sementara dengan status “Saving”. Setelah selesai, versi yang tersimpan akan muncul di daftar.

Poin penting:

- Nama versi dibuat otomatis
- Membuat versi dari bilah atas, shortcut, atau halaman daftar memberikan hasil yang sama
- Daftar menampilkan nama versi, deskripsi, ukuran file, waktu pembuatan, pembuat, dan tindakan yang tersedia

## Mengelola dan memulihkan versi

Daftar versi terutama menyediakan tindakan berikut:

- 「Refresh」 memuat ulang daftar saat ini
- 「Delete」 menghapus satu versi atau beberapa versi yang dipilih
- 「Restore」 memulihkan aplikasi ke keadaan yang tersimpan pada versi itu

:::warning Perhatian

Memulihkan versi akan menimpa konfigurasi aplikasi saat ini dan data yang termasuk dalam versi tersebut. Sebaiknya buat dulu versi dari keadaan saat ini sebelum melakukan pemulihan, supaya kamu bisa kembali lagi jika perlu.

:::

Setelah kamu mengklik 「Restore」, aplikasi akan masuk ke mode pemeliharaan untuk waktu singkat selama proses pemulihan berjalan. Jangan kirim permintaan pemulihan lain selama proses ini. Jika pemulihan gagal, antarmuka akan menampilkan notifikasi kesalahan.

## Mengatur aturan versi

Buka tab 「Settings」 untuk mengatur retensi dan isi setiap versi.

![](https://static-docs.nocobase.com/20260526220720.png)

Pengaturannya meliputi:

- `Versions to keep`: jumlah maksimum versi yang disimpan. Versi lama akan dihapus otomatis setelah batas terlampaui
- `Shortcut: create version`: shortcut untuk membuat versi. Tekan `Ctrl + huruf` untuk mengatur, atau `Backspace` untuk menghapus
- `User collections`: pilih data dari koleksi buatan pengguna mana yang harus ikut dimasukkan ke dalam versi yang disimpan

:::tip

Secara default, versi yang disimpan tidak menyertakan data dari koleksi buatan pengguna. Kamu hanya perlu memilih koleksi di sini jika ingin memulihkan sebagian data bisnis bersama versi aplikasi.

:::

Jika kamu menyertakan satu koleksi pengguna, NocoBase juga akan menyertakan koleksi terkait secara otomatis, sehingga hasil pemulihan biasanya lebih lengkap.

## Tautan terkait

- [Manajemen Backup](../backup-manager/index.mdx) — kemampuan dasar yang dibutuhkan kontrol versi
- [Manajemen Migrasi](../migration-manager/index.md) — memindahkan konfigurasi aplikasi antar lingkungan
- [Manajemen Release](../release-management/index.md) — merencanakan alur rilis dengan backup, migrasi, dan variabel
