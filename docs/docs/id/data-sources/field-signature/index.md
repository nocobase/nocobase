---
pkg: "@nocobase/plugin-field-signature"
---

# Kolom tabel data: tanda tangan tulisan tangan

## Pengenalan

Kolom tanda tangan tulisan tangan memungkinkan pengguna menulis tanda tangan di kanvas menggunakan mouse atau layar sentuh. Setelah disimpan, gambar tanda tangan akan ditulis ke **tabel data file** yang dipilih dan menggunakan kembali proses pengunggahan serta penyimpanan file yang disediakan oleh **Manajer File**.

## Penginstalan

1. Pastikan lingkungan saat ini adalah **Edisi Profesional atau yang lebih tinggi** dan lisensinya masih berlaku.
2. Buka **Manajer Plugin**, temukan **Kolom tabel data: tanda tangan tulisan tangan**（`@nocobase/plugin-field-signature`） lalu aktifkan.
3. Pastikan **Manajer File**（`@nocobase/plugin-file-manager`） telah diaktifkan. Kolom tanda tangan tulisan tangan bergantung pada kemampuan tabel data file, pengunggahan, dan penyimpanan yang disediakannya; jika tidak diaktifkan, gambar tanda tangan tidak dapat disimpan.

## Panduan penggunaan

### Menambahkan kolom

Di **Sumber Data** → pilih tabel data → **Konfigurasi Kolom** → **Tambah Kolom** → pilih **Tanda tangan tulisan tangan** di grup multimedia.

### Konfigurasi kolom

- **Tabel data file**: wajib diisi; pilih tabel data file yang akan digunakan untuk menyimpan file（misalnya `attachments`）, dan gambar tanda tangan akan disimpan di sini.
- Konfigurasi penyimpanan dan aturan pengunggahan yang sebenarnya digunakan oleh gambar tanda tangan ditentukan oleh tabel data file yang dipilih.

### Konfigurasi antarmuka

- Setelah kolom tanda tangan tulisan tangan ditambahkan ke formulir, Anda dapat menyesuaikan **Pengaturan tanda tangan** dalam konfigurasi antarmuka kolom, termasuk warna goresan, warna latar belakang, lebar kanvas tanda tangan, tinggi kanvas tanda tangan, serta lebar dan tinggi gambar mini.
- Dalam tampilan hanya-baca, Anda juga dapat menyesuaikan lebar dan tinggi gambar mini tanda tangan untuk mengatur ukuran tampilan gambar tanda tangan.
### Operasi antarmuka

- Klik area kolom untuk membuka kanvas tanda tangan. Setelah selesai menulis, konfirmasikan untuk mengunggah dan mengaitkannya dengan catatan file yang sesuai.
- Pada perangkat dengan layar kecil, Anda dapat menggunakan antarmuka tanda tangan dalam mode lanskap atau layar penuh agar lebih mudah menulis.
![20260709232226](https://static-docs.nocobase.com/20260709232226.png)
