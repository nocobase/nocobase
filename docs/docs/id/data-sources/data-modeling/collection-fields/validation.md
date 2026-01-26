:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Validasi Bidang
Untuk memastikan akurasi, keamanan, dan konsistensi koleksi data, NocoBase menyediakan fungsi validasi bidang. Fitur ini terdiri dari dua bagian utama: konfigurasi aturan dan penerapan aturan validasi.

## Konfigurasi Aturan
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Bidang sistem NocoBase mengintegrasikan aturan [Joi](https://joi.dev/api/), dengan dukungan sebagai berikut:

### Tipe String
Tipe string Joi sesuai dengan tipe bidang NocoBase berikut: Teks Satu Baris, Teks Panjang, Nomor Telepon, Email, URL, Kata Sandi, dan UUID.
#### Aturan Umum
- Panjang minimum
- Panjang maksimum
- Panjang
- Pola (Regular Expression)
- Wajib diisi

#### Email
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Lihat opsi lainnya](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Lihat opsi lainnya](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Lihat opsi lainnya](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Tipe Angka
Tipe angka Joi sesuai dengan tipe bidang NocoBase berikut: Bilangan Bulat, Angka, dan Persentase.
#### Aturan Umum
- Lebih besar dari
- Lebih kecil dari
- Nilai maksimum
- Nilai minimum
- Kelipatan

#### Bilangan Bulat
Selain aturan umum, bidang bilangan bulat juga mendukung [validasi bilangan bulat](https://joi.dev/api/?v=17.13.3#numberinteger) dan [validasi bilangan bulat tidak aman](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Angka & Persentase
Selain aturan umum, bidang angka dan persentase juga mendukung [validasi presisi](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipe Tanggal
Tipe tanggal Joi sesuai dengan tipe bidang NocoBase berikut: Tanggal (dengan zona waktu), Tanggal (tanpa zona waktu), Hanya Tanggal, dan Timestamp Unix.

Aturan validasi yang didukung:
- Lebih besar dari
- Lebih kecil dari
- Nilai maksimum
- Nilai minimum
- Validasi format timestamp
- Wajib diisi

### Bidang Relasi
Bidang relasi hanya mendukung validasi wajib diisi. Perlu diperhatikan bahwa validasi wajib diisi untuk bidang relasi saat ini belum didukung dalam skenario sub-formulir atau sub-tabel.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Penerapan Aturan Validasi
Setelah mengonfigurasi aturan bidang, aturan validasi yang sesuai akan terpicu saat menambahkan atau memodifikasi data.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Aturan validasi juga berlaku untuk komponen sub-tabel dan sub-formulir:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Perlu diperhatikan bahwa dalam skenario sub-formulir atau sub-tabel, validasi wajib diisi untuk bidang relasi tidak berlaku.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Perbedaan dengan Validasi Bidang Sisi Klien
Validasi bidang sisi klien dan sisi server diterapkan dalam skenario aplikasi yang berbeda. Keduanya memiliki perbedaan signifikan dalam cara implementasi dan waktu pemicuan aturan, oleh karena itu perlu dikelola secara terpisah.

### Perbedaan Metode Konfigurasi
- **Validasi sisi klien**: Konfigurasi aturan di formulir edit (seperti yang ditunjukkan pada gambar di bawah)
- **Validasi bidang sisi server**: Atur aturan bidang di sumber data → Konfigurasi koleksi
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Perbedaan Waktu Pemicuan Validasi
- **Validasi sisi klien**: Memicu validasi secara *real-time* saat pengguna mengisi bidang, dan segera menampilkan pesan kesalahan.
- **Validasi bidang sisi server**: Memvalidasi di sisi server sebelum data masuk ke *database* setelah data dikirimkan, dengan pesan kesalahan dikembalikan melalui respons API.
- **Cakupan aplikasi**: Validasi bidang sisi server berlaku tidak hanya saat pengiriman formulir, tetapi juga terpicu dalam semua skenario yang melibatkan penambahan atau modifikasi data, seperti alur kerja dan impor data.
- **Pesan kesalahan**: Validasi sisi klien mendukung pesan kesalahan kustom, sedangkan validasi sisi server saat ini tidak mendukung pesan kesalahan kustom.