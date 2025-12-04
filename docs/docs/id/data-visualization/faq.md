:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pertanyaan Umum

## Pemilihan Bagan
### Bagaimana cara memilih bagan yang sesuai?
Jawab: Pilih berdasarkan tujuan dan data Anda:
- Tren atau perubahan: Bagan garis atau area
- Perbandingan nilai: Bagan kolom atau batang
- Komposisi atau proporsi: Bagan pai atau donat
- Korelasi atau distribusi: Bagan sebar
- Struktur hierarki atau progres tahapan: Bagan corong

Untuk jenis bagan lainnya, silakan lihat [contoh ECharts](https://echarts.apache.org/examples).

### Jenis bagan apa saja yang didukung NocoBase?
Jawab: Mode visualisasi menyertakan bagan umum (garis, area, kolom, batang, pai, donat, corong, sebar, dll.). Mode kustom mendukung semua jenis bagan ECharts.

## Masalah Kueri Data
### Apakah mode visualisasi dan mode SQL saling berbagi konfigurasi?
Jawab: Tidak. Konfigurasi keduanya disimpan secara terpisah. Mode yang digunakan saat terakhir Anda menyimpan akan diterapkan.

## Opsi Bagan
### Bagaimana cara mengonfigurasi kolom bagan?
Jawab: Dalam mode visualisasi, pilih kolom data sesuai dengan jenis bagan. Misalnya, bagan garis atau kolom memerlukan konfigurasi kolom sumbu X dan sumbu Y; bagan pai memerlukan konfigurasi kolom kategori dan kolom nilai.
Disarankan untuk menjalankan "Jalankan kueri" terlebih dahulu untuk memverifikasi apakah data sudah sesuai harapan. Secara default, pemetaan kolom bagan akan dicocokkan secara otomatis.

## Pratinjau dan Simpan
### Apakah saya perlu mempratinjau perubahan secara manual setelah mengonfigurasi?
Jawab: Dalam mode visualisasi, perubahan akan dipratinjau secara otomatis. Dalam mode SQL dan mode kustom, untuk menghindari pembaruan yang sering, selesaikan penulisan dan klik "Pratinjau" secara manual.

### Mengapa pratinjau hilang setelah menutup dialog?
Jawab: Efek pratinjau hanya untuk tampilan sementara. Setelah melakukan perubahan konfigurasi, harap simpan terlebih dahulu sebelum menutup. Perubahan yang belum disimpan tidak akan dipertahankan.