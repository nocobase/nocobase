:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

## Petunjuk Konfigurasi

### Mengaktifkan Fitur Cetak Templat
Cetak templat saat ini mendukung blok detail dan blok tabel. Berikut adalah cara konfigurasi untuk kedua jenis blok ini.

#### Blok Detail

1.  **Buka Blok Detail**:
    -   Di aplikasi, masuk ke blok detail tempat Anda ingin menggunakan fitur cetak templat.

2.  **Akses Menu Operasi Konfigurasi**:
    -   Di bagian atas antarmuka, klik menu "Operasi Konfigurasi".

3.  **Pilih "Cetak Templat"**:
    -   Di menu tarik-turun, klik opsi "Cetak Templat" untuk mengaktifkan fungsi plugin.

![Mengaktifkan Cetak Templat](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Mengonfigurasi Templat

1.  **Akses Halaman Konfigurasi Templat**:
    -   Di menu konfigurasi tombol "Cetak Templat", pilih opsi "Konfigurasi Templat".

![Opsi Konfigurasi Templat](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Tambahkan Templat Baru**:
    -   Klik tombol "Tambahkan Templat" untuk masuk ke halaman penambahan templat.

![Tombol Tambahkan Templat](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Isi Informasi Templat**:
    -   Di formulir templat, isi nama templat dan pilih jenis templat (Word, Excel, PowerPoint).
    -   Unggah berkas templat yang sesuai (mendukung format `.docx`, `.xlsx`, `.pptx`).

![Konfigurasi Nama dan Berkas Templat](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Edit dan Simpan Templat**:
    -   Buka halaman "Daftar Bidang", salin bidang-bidang, lalu tempelkan ke dalam templat.
    ![Daftar Bidang](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   Setelah selesai mengisi, klik tombol "Simpan" untuk menyelesaikan penambahan templat.

5.  **Manajemen Templat**:
    -   Klik tombol "Gunakan" di sisi kanan daftar templat untuk mengaktifkan templat.
    -   Klik tombol "Edit" untuk mengubah nama templat atau mengganti berkas templat.
    -   Klik tombol "Unduh" untuk mengunduh berkas templat yang sudah dikonfigurasi.
    -   Klik tombol "Hapus" untuk menghapus templat yang tidak lagi diperlukan. Sistem akan meminta konfirmasi untuk menghindari penghapusan yang tidak disengaja.
    ![Manajemen Templat](https://static-docs.nocobase.com/20250107140436.png)

#### Blok Tabel

Penggunaan blok tabel pada dasarnya sama dengan blok detail, dengan perbedaan sebagai berikut:

1.  **Mendukung Pencetakan Banyak Data**: Anda perlu memilih terlebih dahulu catatan yang ingin dicetak. Maksimal 100 catatan dapat dicetak sekaligus.

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Manajemen Isolasi Templat**: Templat untuk blok tabel dan blok detail tidak dapat saling digunakan — karena struktur datanya berbeda (satu adalah objek, yang lain adalah array).