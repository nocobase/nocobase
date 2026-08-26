---
pkg: "@nocobase/plugin-comments"
title: "Collection Comment"
description: "Collection Comment menyimpan komentar dan umpan balik pengguna, mendukung rich text, terhubung ke Collection mana pun, komentar berjenjang, dan pelacakan pengguna, menambahkan kemampuan diskusi pada record data."
keywords: "collection comment,fitur komentar,komentar rich text,komentar berjenjang,Collection Comment,NocoBase"
---
# Collection Comment

## Pengantar

Collection Comment adalah template Collection khusus untuk menyimpan komentar dan umpan balik pengguna. Melalui fitur komentar, Anda dapat menambahkan fungsi komentar ke Collection mana pun, sehingga pengguna dapat berdiskusi, memberikan umpan balik, atau menandai record tertentu. Collection Comment mendukung edit rich text, menyediakan kemampuan kreasi konten yang fleksibel.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Karakteristik Fitur

- **Edit Rich Text**: Secara default menyertakan editor Markdown (vditor), mendukung kreasi konten rich text
- **Terhubung ke Collection mana pun**: Dapat menghubungkan komentar ke record Collection mana pun melalui field relasi
- **Komentar Berjenjang**: Mendukung balasan terhadap komentar, membentuk struktur tree komentar
- **Pelacakan Pengguna**: Otomatis mencatat pembuat komentar dan waktu pembuatan

## Panduan Penggunaan

### Membuat Collection Comment

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Masuk ke halaman manajemen Collection
2. Klik tombol "Buat Collection Baru"
3. Pilih template "Collection Comment"
4. Masukkan nama Collection (misalnya: "Komentar Task", "Komentar Artikel", dan lainnya)
5. Sistem akan otomatis membuat Collection Comment dengan field default berikut:
   - Konten komentar (tipe Markdown vditor)
   - Pembuat (terhubung ke Collection user)
   - Waktu pembuatan (tipe datetime)

### Konfigurasi Relasi

Agar komentar dapat terhubung ke Collection target, Anda perlu mengonfigurasi field relasi:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Tambahkan field relasi "Many to One" pada Collection Comment
2. Pilih Collection target yang akan dihubungkan (misalnya: Collection task, Collection artikel, dan lainnya)
3. Atur nama field (misalnya: "Task Terkait", "Artikel Terkait", dan lainnya)

### Menggunakan Block Komentar di Halaman

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Masuk ke halaman tempat fungsi komentar perlu ditambahkan
2. Tambahkan block pada detail atau popup record target
3. Pilih tipe block "Komentar"
4. Pilih Collection comment yang baru saja dibuat


### Skenario Aplikasi Tipikal

- **Sistem Manajemen Task**: Anggota tim mendiskusikan dan memberikan umpan balik terhadap task
- **Sistem Manajemen Konten**: Pembaca berkomentar dan berinteraksi dengan artikel
- **Alur Approval**: Approver memberikan catatan dan opini terhadap formulir aplikasi
- **Umpan Balik Pelanggan**: Mengumpulkan evaluasi pelanggan terhadap produk atau layanan

## Perhatian

- Collection Comment adalah fitur plugin komersial, plugin komentar perlu diaktifkan untuk digunakan
- Disarankan untuk mengatur izin yang sesuai pada Collection Comment, untuk mengontrol siapa yang dapat melihat, membuat, dan menghapus komentar
- Untuk skenario komentar dalam jumlah besar, disarankan untuk mengaktifkan paginasi guna meningkatkan performa
