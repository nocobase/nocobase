---
title: "Validasi Field"
description: "Aturan validasi field: aturan konfigurasi dan aturan validasi berbasis Joi, mendukung minimum/maksimum panjang, wajib diisi, dan lainnya untuk tipe seperti string, number, datetime."
keywords: "validasi field,validasi field,Joi,aturan validasi,aturan konfigurasi,NocoBase"
---

# Validasi Field
Untuk memastikan akurasi, keamanan, dan konsistensi data Collection, NocoBase menyediakan fitur validasi field. Fitur ini dibagi menjadi dua bagian utama: aturan konfigurasi dan aturan validasi.

## Aturan Konfigurasi
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Field sistem NocoBase mengintegrasikan aturan [Joi](https://joi.dev/api/), dengan dukungan sebagai berikut:

### Tipe String
Tipe String Joi sesuai dengan tipe field NocoBase berikut: Teks Satu Baris, Teks Multi Baris, Nomor Telepon, Email, URL, Password, UUID.
#### Aturan Umum
- Panjang Minimum
- Panjang Maksimum
- Panjang
- Regular Expression
- Wajib Diisi

#### Email
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Lihat opsi lainnya](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Lihat opsi lainnya](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Lihat opsi lainnya](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Tipe Number
Tipe Number Joi sesuai dengan tipe field NocoBase berikut: Integer, Number, Persen.
#### Aturan Umum
- Lebih Besar Dari
- Lebih Kecil Dari
- Nilai Maksimum
- Nilai Minimum
- Kelipatan Bilangan Bulat

#### Integer
Selain aturan umum, field integer juga mendukung [validasi integer](https://joi.dev/api/?v=17.13.3#numberinteger) dan [validasi unsafe integer](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Number dan Persen
Selain aturan umum, field number dan persen juga mendukung [validasi presisi](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipe Tanggal
Tipe Date Joi sesuai dengan tipe field NocoBase berikut: Tanggal (dengan timezone), Tanggal (tanpa timezone), Hanya Tanggal, Unix Timestamp.

Aturan validasi yang didukung:
- Lebih Besar Dari
- Lebih Kecil Dari
- Nilai Maksimum
- Nilai Minimum
- Validasi Format Timestamp
- Wajib Diisi

### Field Relasi
Field relasi hanya mendukung validasi wajib diisi. Perhatikan bahwa validasi wajib diisi pada field relasi untuk sementara tidak didukung pada skenario sub form atau sub table.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Penerapan Aturan Validasi
Setelah aturan field dikonfigurasi, aturan validasi yang sesuai akan dipicu saat menambahkan atau mengubah data.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Aturan validasi juga berlaku untuk komponen sub table dan sub form:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Perhatikan bahwa pada skenario sub form atau sub table, validasi wajib diisi pada field relasi untuk sementara tidak berlaku.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Perbedaan dengan Validasi Field Sisi Klien
Validasi field server-side cocok untuk skenario aplikasi yang berbeda dengan validasi field sisi klien. Keduanya memiliki perbedaan signifikan dalam cara implementasi dan waktu pemicu aturan, sehingga perlu dikelola secara terpisah.

### Perbedaan Cara Konfigurasi
- **Validasi Klien**: Konfigurasi aturan pada form edit (seperti gambar di bawah)
- **Validasi Field Server**: Atur aturan field di Data Source → Konfigurasi Collection
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Perbedaan Waktu Pemicu Validasi
- **Validasi Klien**: Memicu validasi secara real-time saat pengguna mengisi field, dan langsung menampilkan pesan error
- **Validasi Field Server**: Setelah data disubmit, server melakukan validasi sebelum data masuk ke database, pesan error dikembalikan melalui respons API
- **Cakupan Aplikasi**: Selain berlaku saat submit form, validasi field server juga akan dipicu di workflow, import data, dan semua skenario yang melibatkan penambahan atau modifikasi data
- **Pesan Error**: Validasi klien mendukung pesan error custom, validasi server untuk sementara tidak mendukung pesan error custom
