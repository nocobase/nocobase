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

Saat field digunakan dalam form, aturan validasi field juga akan ditampilkan di pengaturan validasi field. Aturan ini muncul di bawah **Aturan validasi field server-side** dan hanya dapat dilihat di sana. Jika perlu mengubahnya, edit field di Data Source → Konfigurasi Collection.

Anda tetap dapat menambahkan aturan tambahan untuk field form saat ini di bawah **Aturan validasi sisi klien**. Aturan ini hanya berlaku untuk komponen field saat ini. Hasil validasi akhir menggabungkan **Aturan validasi field server-side** dan **Aturan validasi sisi klien**.

Aturan validasi juga berlaku untuk komponen sub table dan sub form:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Perhatikan bahwa pada skenario sub form atau sub table, validasi wajib diisi pada field relasi untuk sementara tidak berlaku.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Perbedaan antara Aturan Validasi Field Server-Side dan Sisi Klien
Aturan validasi field server-side dan aturan validasi sisi klien dikonfigurasi di tempat yang berbeda dan memiliki cakupan yang berbeda.

### Perbedaan Cara Konfigurasi
- **Aturan validasi field server-side**: Atur aturan field di Data Source → Konfigurasi Collection. Aturan ini adalah aturan dasar field
- **Aturan validasi sisi klien**: Konfigurasi aturan tambahan di pengaturan field form. Aturan ini hanya memengaruhi komponen field saat ini
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Perbedaan Waktu Pemicu Validasi
- **Aturan validasi field server-side**: Memicu validasi frontend saat field digunakan dalam form, dan juga melakukan validasi sebelum data ditulis. Aturan ini juga berlaku pada skenario yang membuat atau memperbarui data, seperti workflow dan import data
- **Aturan validasi sisi klien**: Hanya memicu validasi frontend pada field form saat ini
- **Tampilan aturan**: Aturan validasi field server-side ditampilkan sebagai aturan turunan yang hanya dapat dilihat. Aturan validasi sisi klien ditampilkan secara terpisah dan dapat diedit di sana
- **Pesan Error**: Aturan validasi sisi klien mendukung pesan error custom, sementara aturan validasi field server-side untuk sementara tidak mendukung pesan error custom
