:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Log Server, Log Audit, dan Riwayat Catatan

## Log Server

### Log Sistem

> Lihat [Log Sistem](#)

- Mencatat informasi operasional sistem aplikasi, melacak alur eksekusi logika kode, dan menelusuri informasi anomali seperti kesalahan eksekusi kode.
- Log dikategorikan berdasarkan tingkat keparahan dan modul fungsional.
- Ditampilkan melalui terminal atau disimpan dalam bentuk file.
- Terutama digunakan untuk mendiagnosis dan memecahkan masalah anomali yang muncul selama pengoperasian sistem.

### Log Permintaan

> Lihat [Log Permintaan](#)

- Mencatat informasi permintaan dan respons HTTP API, dengan fokus pada ID permintaan, jalur API, header, kode status respons, dan durasi.
- Ditampilkan melalui terminal atau disimpan dalam bentuk file.
- Terutama digunakan untuk melacak pemanggilan dan kinerja eksekusi API.

## Log Audit

> Lihat [Log Audit](../security/audit-logger/index.md)

- Mencatat tindakan pengguna (atau API) terhadap sumber daya sistem, dengan fokus pada jenis sumber daya, objek target, jenis operasi, informasi pengguna, dan status operasi.
- Untuk melacak konten dan hasil spesifik dari operasi pengguna dengan lebih baik, parameter permintaan dan respons akan dicatat sebagai informasi Metadata. Bagian informasi ini sebagian tumpang tindih dengan log permintaan tetapi tidak sepenuhnya identik. Misalnya, log permintaan yang ada biasanya tidak mencatat seluruh isi permintaan (request body).
- Parameter permintaan dan respons **tidak setara** dengan snapshot data. Keduanya dapat mengungkapkan jenis operasi yang terjadi, tetapi tidak dapat secara akurat mengetahui konten catatan tabel data sebelum modifikasi. Oleh karena itu, tidak dapat digunakan untuk kontrol versi atau pemulihan data setelah kesalahan operasi.
- Disimpan dalam bentuk file dan tabel database.

![](https://static-docs.nocobase.com/202501031627922.png)

## Riwayat Catatan

> Lihat [Riwayat Catatan](/record-history/index.md)

- Mencatat **riwayat perubahan** konten data.
- Mencatat jenis sumber daya, objek sumber daya, jenis operasi, kolom yang diubah, serta nilai sebelum dan sesudah perubahan.
- Berguna untuk **perbandingan data dan audit**.
- Disimpan dalam bentuk tabel database.

![](https://static-docs.nocobase.com/202511011338499.png)