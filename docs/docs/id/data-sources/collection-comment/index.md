---
pkg: "@nocobase/plugin-comments"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Koleksi Komentar

## Pendahuluan

Koleksi komentar adalah template tabel data khusus yang dirancang untuk menyimpan komentar dan umpan balik pengguna. Dengan fitur komentar, Anda dapat menambahkan kemampuan berkomentar ke tabel data mana pun, memungkinkan pengguna untuk berdiskusi, memberikan umpan balik, atau membuat anotasi pada catatan tertentu. Koleksi komentar mendukung pengeditan teks kaya (rich text editing), menyediakan kemampuan pembuatan konten yang fleksibel.

![comment-collection-2025-11-01-00-39-01](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-39-01.png)

## Fitur

- **Pengeditan Teks Kaya**: Secara default menyertakan editor Markdown (vditor), mendukung pembuatan konten teks kaya.
- **Terkait dengan Tabel Data Apa Pun**: Dapat mengaitkan komentar dengan catatan di tabel data mana pun melalui kolom relasi.
- **Komentar Bertingkat**: Mendukung balasan komentar, membangun struktur pohon komentar.
- **Pelacakan Pengguna**: Secara otomatis mencatat pembuat komentar dan waktu pembuatan.

## Panduan Pengguna

### Membuat Koleksi Komentar

![comment-collection-2025-11-01-00-37-10](https://static-docs.nocobase.com/comment-collection-2025-11-01-00-37-10.png)

1. Buka halaman manajemen tabel data.
2. Klik tombol "Buat Koleksi".
3. Pilih template "Koleksi Komentar".
4. Masukkan nama tabel (misalnya, "Komentar Tugas", "Komentar Artikel", dll.).
5. Sistem akan secara otomatis membuat tabel komentar dengan kolom default berikut:
   - Konten komentar (tipe Markdown vditor)
   - Dibuat oleh (terhubung ke tabel pengguna)
   - Dibuat pada (tipe tanggal dan waktu)

### Mengonfigurasi Relasi

Agar komentar dapat terhubung ke tabel data target, Anda perlu mengonfigurasi kolom relasi:

![](https://static-docs.nocobase.com/Solution/demoE3v1-19N.gif)

1. Tambahkan kolom relasi "Banyak-ke-Satu" di tabel komentar.
2. Pilih tabel data target yang akan dihubungkan (misalnya: tabel tugas, tabel artikel, dll.).
3. Atur nama kolom (misalnya: "Milik Tugas", "Milik Artikel", dll.).

### Menggunakan Blok Komentar di Halaman

![Enable Comments Collection](https://static-docs.nocobase.com/Solution/demoE3v1-20.gif)

1. Buka halaman tempat Anda ingin menambahkan fungsionalitas komentar.
2. Tambahkan blok di detail atau pop-up catatan target.
3. Pilih tipe blok "Komentar".
4. Pilih koleksi komentar yang baru saja Anda buat.

### Skenario Penggunaan Umum

- **Sistem Manajemen Tugas**: Anggota tim berdiskusi dan memberikan umpan balik tentang tugas.
- **Sistem Manajemen Konten**: Pembaca berkomentar dan berinteraksi dengan artikel.
- **Alur Kerja Persetujuan**: Pemberi persetujuan membuat anotasi dan memberikan pendapat pada formulir aplikasi.
- **Umpan Balik Pelanggan**: Mengumpulkan ulasan pelanggan tentang produk atau layanan.

## Catatan Penting

- Koleksi komentar adalah fitur **plugin** komersial dan memerlukan **plugin** komentar untuk diaktifkan agar dapat digunakan.
- Disarankan untuk mengatur izin yang sesuai untuk tabel komentar guna mengontrol siapa yang dapat melihat, membuat, dan menghapus komentar.
- Untuk skenario dengan jumlah komentar yang banyak, disarankan untuk mengaktifkan pemuatan berhalaman (pagination) untuk meningkatkan kinerja.