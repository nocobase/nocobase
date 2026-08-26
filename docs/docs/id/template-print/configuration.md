---
title: "Konfigurasi Template Print"
description: "Konfigurasi NocoBase Template Print: aktivasi fitur Template Print di Block Detail dan Block Tabel, konfigurasi Template."
keywords: "Template Print,Konfigurasi,configuration,NocoBase"
---

## Konfigurasi

### Aktivasi Fitur Template Print
Template Print saat ini mendukung Block Detail dan Block Tabel, di bawah ini akan dijelaskan masing-masing cara konfigurasi kedua jenis Block tersebut.

#### Block Detail

1. **Buka Block Detail**:
- Pada aplikasi, masuk ke Block Detail yang membutuhkan fitur Template Print.

2. **Masuk ke Menu Konfigurasi Action**:
- Pada bagian atas antarmuka, klik menu "Configure Actions".

3. **Pilih "Template Print"**:
- Pada drop-down menu, klik opsi "Template Print" untuk mengaktifkan fitur plugin.

![Aktivasi Template Print](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Konfigurasi Template

1. **Masuk ke Halaman Konfigurasi Template**:
- Pada menu konfigurasi tombol "Template Print", pilih opsi "Template Configuration".

![Opsi Konfigurasi Template](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2. **Tambah Template Baru**:
- Klik tombol "Add Template", masuk ke halaman tambah Template.

![Tombol Tambah Template](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3. **Isi Informasi Template**:
- Pada form Template, isi nama Template, pilih tipe Template (Word, Excel, PowerPoint).
- Upload file Template yang sesuai (mendukung format `.docx`, `.xlsx`, `.pptx`).

![Konfigurasi Nama dan File Template](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4. **Edit dan Simpan Template**:
- Buka halaman "Field List", salin field, dan isi ke Template
  ![Field List](https://static-docs.nocobase.com/20250107141010.png)
  ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
- Template Print sudah mendukung **field lampiran** dan **field tanda tangan tulisan tangan**, Field List akan secara otomatis menghasilkan ekspresi Template yang sesuai.
- Jika Anda ingin menampilkan gambar pada Template, disarankan selalu menyalin variabel langsung dari "Field List", bukan menulis ekspresi `:attachment()` atau `:signature()` secara manual.
- Setelah selesai mengisi, klik tombol "Save" untuk menyelesaikan penambahan Template.

5. **Manajemen Template**:
- Klik tombol "Use" di sebelah kanan daftar Template untuk mengaktifkan Template.
- Klik tombol "Edit" untuk memodifikasi nama Template atau mengganti file Template.
- Klik tombol "Download" untuk mengunduh file Template yang sudah dikonfigurasi.
- Klik tombol "Delete" untuk menghapus Template yang tidak diperlukan lagi. Sistem akan menampilkan konfirmasi untuk menghindari penghapusan yang tidak disengaja.
  ![Manajemen Template](https://static-docs.nocobase.com/20250107140436.png)

#### Block Tabel

Penggunaan Block Tabel pada dasarnya sama dengan Block Detail, perbedaannya:
1. Mendukung Print beberapa data: Perlu memilih record yang akan diprint terlebih dahulu, maksimal 100 sekaligus.
   
![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2. Manajemen Template Terisolasi: Template Block Tabel dan Block Detail tidak dapat saling digunakan — karena struktur datanya berbeda (satu adalah objek, satu adalah array).


