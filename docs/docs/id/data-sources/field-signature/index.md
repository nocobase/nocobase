---
pkg: "@nocobase/plugin-field-signature"
---

# Field Collection: Tanda Tangan

## Pengantar

Field tanda tangan memungkinkan pengguna menulis tanda tangan di canvas menggunakan mouse atau touchscreen. Setelah disimpan, gambar tanda tangan akan ditulis ke **Collection File** yang dipilih, dan menggunakan kembali alur upload dan penyimpanan file yang disediakan oleh **File Manager**.

## Instalasi

1. Pastikan environment saat ini adalah **Pro Edition atau lebih tinggi**, dan lisensi valid.
2. Buka **Plugin Manager**, temukan **Field Collection: Tanda Tangan** (`@nocobase/plugin-field-signature`) lalu aktifkan.
3. Pastikan **File Manager** (`@nocobase/plugin-file-manager`) sudah diaktifkan. Field tanda tangan bergantung padanya untuk menyediakan Collection file, kemampuan upload, dan penyimpanan; tanpa diaktifkan, gambar tanda tangan tidak dapat disimpan.

## Petunjuk Penggunaan

### Menambahkan Field

Pada **Data Source** → pilih Collection → **Konfigurasi Field** → **Tambah Field** → pilih **Tanda Tangan** dalam grup multimedia.

### Konfigurasi Field

- **Collection File**: Wajib; harap pilih Collection File yang akan digunakan untuk menyimpan file (misalnya `attachments`), gambar tanda tangan akan disimpan di sini.
- Konfigurasi storage aktual yang digunakan gambar tanda tangan dan aturan upload, ditentukan oleh Collection File yang dipilih.

### Konfigurasi UI

- Setelah field tanda tangan ditambahkan ke form, Anda dapat menyesuaikan **Pengaturan Tanda Tangan** dalam konfigurasi UI field, termasuk warna goresan, warna latar belakang, lebar canvas tanda tangan, tinggi canvas tanda tangan, serta lebar dan tinggi thumbnail.
- Pada skenario tampilan read-only, Anda juga dapat menyesuaikan lebar dan tinggi thumbnail tanda tangan, untuk mengontrol ukuran tampilan gambar tanda tangan.

### Operasi UI

- Klik area field untuk membuka canvas tanda tangan. Setelah selesai menulis, konfirmasi untuk upload dan menghubungkan record file yang sesuai.
- Pada perangkat layar kecil, Anda dapat menggunakan antarmuka tanda tangan landscape/full-screen untuk memudahkan penulisan.
