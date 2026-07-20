---
pkg: '@nocobase/plugin-version-control'
title: "Kontrol versi"
description: "Panduan plugin kontrol versi: menyimpan versi otomatis saat AI Builder menyelesaikan pencapaian penting, membuat dan memulihkan versi secara manual, mengatur retensi, shortcut, dan koleksi pengguna yang ikut disimpan."
keywords: "Kontrol versi,Version control,manajemen operasi,AI Builder,nocobase-revision,nb revision create,membuat versi,memulihkan versi,NocoBase"
---

# Kontrol versi

Di NocoBase, **Kontrol versi** memungkinkan kamu menyimpan versi aplikasi saat ini yang bisa dipulihkan kembali. Kamu bisa membuat versi secara manual, memulihkan aplikasi ke versi yang sudah disimpan saat diperlukan, dan membiarkan AI Builder menyimpan versi otomatis setelah pencapaian penting selesai.

Kontrol versi bergantung pada [Manajemen Backup](../backup-manager/index.mdx) untuk menyimpan dan memulihkan status aplikasi. Sebelum menggunakan kontrol versi, aktifkan Manajemen Backup terlebih dahulu.

:::warning Catatan

Edisi Community dan Standard tidak menyertakan plugin kontrol versi. Jika kamu perlu menyimpan status aplikasi yang bisa dipulihkan, gunakan [Manajemen Backup](../backup-manager/index.mdx): buat backup manual sebelum perubahan penting, lalu pulihkan backup yang sesuai saat perlu kembali ke kondisi sebelumnya.

:::

## Versi otomatis dari AI

Setelah plugin kontrol versi diaktifkan, AI Builder memiliki lapisan pemulihan tambahan. Saat AI Agent mulai menangani permintaan, ia memeriksa NocoBase Skills yang tersedia untuk aplikasi saat ini. Jika menemukan skill `nocobase-revision`, ia dapat menyimpan titik pembangunan penting sebagai versi yang bisa dipulihkan.

![AI mendeteksi skill nocobase-revision saat mulai membangun](https://static-docs.nocobase.com/20260611115845.png)

Ketika AI menyelesaikan bagian yang bisa diperiksa secara terpisah, seperti membuat halaman, membuat sekumpulan koleksi, atau mengonfigurasi workflow, AI menjalankan `nb revision create` melalui NocoBase CLI. Kamu tidak perlu mengklik 「Create version」 secara manual setiap kali, dan penyesuaian kecil tidak akan membuat catatan versi menjadi terlalu banyak.

![AI membuat versi setelah membangun](https://static-docs.nocobase.com/20260611115804.png)

Versi ini akan muncul di daftar versi. Jika perubahan berikutnya tidak sesuai harapan, kamu bisa memulihkan ke titik pembangunan sebelumnya yang jelas, lalu melanjutkan penyesuaian dari sana.

## Membuka plugin

Setelah plugin diaktifkan, menu 「Version control」 muncul di bilah atas. Dari sana kamu bisa langsung membuat versi atau membuka daftar versi.

Kamu juga bisa membuka halaman plugin dari 「System settings / Version control」. Shortcut bawaan untuk membuat versi adalah `Ctrl + K`, dan kamu bisa mengubahnya di tab pengaturan.

![Menu Version control](https://static-docs.nocobase.com/20260611112317.png)

## Membuat versi

Klik 「Create version」, isi deskripsi, lalu simpan. Deskripsi bisa sampai 2000 karakter. Bagian ini cocok untuk mencatat konteks perubahan, misalnya “Menyesuaikan field dan izin alur persetujuan”.

![Membuat versi](https://static-docs.nocobase.com/20260611112739.png)

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
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — memakai bahasa alami untuk pemodelan data, konfigurasi halaman, dan orkestrasi workflow
