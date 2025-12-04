:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Basis Pengetahuan

## Pendahuluan

Basis pengetahuan adalah fondasi dari pengambilan informasi RAG (Retrieval Augmented Generation). Basis pengetahuan mengorganisir dokumen berdasarkan kategori dan membangun indeks. Ketika karyawan AI menjawab pertanyaan, ia akan memprioritaskan pencarian jawaban dari basis pengetahuan.

## Manajemen Basis Pengetahuan

Buka halaman konfigurasi **plugin** karyawan AI, lalu klik tab `Knowledge base` untuk masuk ke halaman manajemen basis pengetahuan.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Klik tombol `Add new` di pojok kanan atas untuk menambahkan basis pengetahuan `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Masukkan informasi yang diperlukan untuk basis pengetahuan baru:

- Pada kolom input `Name`, masukkan nama basis pengetahuan;
- Pada `File storage`, pilih lokasi penyimpanan berkas;
- Pada `Vector store`, pilih penyimpanan vektor, lihat [Penyimpanan Vektor](/ai-employees/knowledge-base/vector-store);
- Pada kolom input `Description`, masukkan deskripsi basis pengetahuan;

Klik tombol `Submit` untuk membuat basis pengetahuan.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Manajemen Dokumen Basis Pengetahuan

Setelah membuat basis pengetahuan, pada halaman daftar basis pengetahuan, klik basis pengetahuan yang baru saja Anda buat untuk masuk ke halaman manajemen dokumen basis pengetahuan.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Klik tombol `Upload` untuk mengunggah dokumen. Setelah dokumen diunggah, proses vektorisasi akan dimulai secara otomatis. Tunggu hingga `Status` berubah dari `Pending` menjadi `Success`.

Saat ini, basis pengetahuan mendukung jenis dokumen berikut: txt, pdf, doc, docx, ppt, pptx; PDF hanya mendukung teks biasa.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Jenis Basis Pengetahuan

### Basis Pengetahuan Local

Basis pengetahuan Local adalah basis pengetahuan yang disimpan secara lokal di NocoBase. Dokumen dan data vektornya semuanya disimpan secara lokal oleh NocoBase.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Basis Pengetahuan Readonly

Basis pengetahuan Readonly adalah basis pengetahuan hanya-baca. Dokumen dan data vektornya dikelola secara eksternal. Hanya koneksi basis data vektor yang dibuat di NocoBase (saat ini hanya mendukung PGVector).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Basis Pengetahuan External

Basis pengetahuan External adalah basis pengetahuan eksternal, di mana dokumen dan data vektornya dikelola di luar NocoBase. Pengambilan data dari basis data vektor memerlukan ekstensi dari pengembang, memungkinkan penggunaan basis data vektor yang saat ini tidak didukung oleh NocoBase.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)