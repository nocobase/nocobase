:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/log-and-monitor/logger/overview).
:::

# Log Server, Log Audit, dan Riwayat Rekaman

## Log Server

### Log Sistem

> Lihat [Log Sistem](./index.md#system-logs)

- Mencatat informasi runtime sistem aplikasi, melacak rantai eksekusi kode, dan menelusuri informasi anomali seperti kesalahan (error) saat kode dijalankan.
- Terdapat tingkatan log, yang dikategorikan berdasarkan modul fungsional.
- Dikeluarkan melalui terminal atau disimpan dalam bentuk file.
- Utamanya digunakan untuk mendiagnosis dan memecahkan masalah anomali yang muncul selama sistem beroperasi.

### Log Permintaan

> Lihat [Log Permintaan](./index.md#request-logs)

- Mencatat informasi permintaan dan respons HTTP API, dengan fokus pada ID permintaan, Path API, header permintaan, kode status respons, durasi, dan informasi lainnya.
- Dikeluarkan melalui terminal atau disimpan dalam bentuk file.
- Utamanya digunakan untuk melacak pemanggilan dan status eksekusi API.

## Log Audit

> Lihat [Log Audit](/security/audit-logger/index.md)

- Mencatat perilaku operasi pengguna (API) terhadap sumber daya sistem, dengan fokus pada jenis sumber daya, objek sumber daya, jenis operasi, informasi pengguna, dan status operasi.
- Untuk melacak konten dan hasil spesifik dari operasi pengguna dengan lebih baik, parameter permintaan dan respons dicatat sebagai informasi Metadata. Bagian informasi ini sebagian tumpang tindih dengan log permintaan, tetapi tidak sepenuhnya identik; misalnya, dalam log permintaan saat ini, biasanya badan permintaan (request body) yang lengkap tidak dicatat.
- Parameter permintaan dan respons **tidak sama** dengan snapshot sumber daya. Melalui parameter dan logika kode, kita dapat mengetahui modifikasi apa yang dihasilkan oleh suatu operasi, tetapi tidak dapat mengetahui secara akurat isi rekaman tabel data sebelum dimodifikasi untuk tujuan kontrol versi atau pemulihan data setelah kesalahan operasi.
- Disimpan dalam bentuk file dan tabel database.

![](https://static-docs.nocobase.com/202501031627922.png)

## Riwayat Rekaman

> Lihat [Riwayat Rekaman](/record-history/index.md)

- Mencatat riwayat perubahan konten data.
- Konten utama yang dicatat adalah jenis sumber daya, objek sumber daya, jenis operasi, bidang (field) yang diubah, serta nilai sebelum dan sesudah perubahan.
- Dapat digunakan untuk perbandingan data.
- Disimpan dalam bentuk tabel database.

![](https://static-docs.nocobase.com/202511011338499.png)