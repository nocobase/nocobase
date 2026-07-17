---
title: "Validasi Field"
description: "Aturan validasi field: aturan konfigurasi dan aturan validasi berbasis Joi, mendukung panjang minimum/maksimum, wajib diisi, dan lainnya untuk tipe string, angka, tanggal, serta tipe lainnya."
keywords: "validasi field, pemeriksaan field,Joi,aturan validasi,aturan konfigurasi,NocoBase"
---

# Validasi field
Untuk memastikan keakuratan, keamanan, dan konsistensi data, NocoBase menyediakan fitur validasi field. Fitur ini terutama dibagi menjadi dua bagian: aturan konfigurasi dan aturan validasi.

## Aturan konfigurasi
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Field sistem NocoBase mengintegrasikan aturan [Joi](https://joi.dev/api/), dengan dukungan sebagai berikut:

### Tipe string
Tipe field NocoBase yang sesuai dengan tipe string Joi meliputi: teks satu baris, teks beberapa baris, nomor ponsel, email, URL, kata sandi, UUID.
#### Aturan umum
- Panjang minimum
- Panjang maksimum
- Panjang
- Ekspresi reguler
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

### Tipe angka
Tipe field NocoBase yang sesuai dengan tipe angka Joi meliputi: bilangan bulat, angka, persentase.
#### Aturan umum
- Lebih besar dari
- Lebih kecil dari
- Nilai maksimum
- Nilai minimum
- Kelipatan bilangan bulat

#### Bilangan bulat
Selain aturan umum, field bilangan bulat juga mendukung [validasi bilangan bulat](https://joi.dev/api/?v=17.13.3#numberinteger) dan [validasi bilangan bulat tidak aman](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Angka dan persentase
Selain aturan umum, field angka dan persentase juga mendukung [validasi presisi](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipe tanggal
Tipe field NocoBase yang sesuai dengan tipe tanggal Joi meliputi: tanggal (dengan zona waktu), tanggal (tanpa zona waktu), tanggal saja, stempel waktu Unix.

Aturan validasi yang didukung:
- Lebih besar dari
- Lebih kecil dari
- Nilai maksimum
- Nilai minimum
- Validasi format stempel waktu
- Wajib diisi

### Field relasi
Field relasi hanya mendukung validasi wajib diisi. Perlu diperhatikan bahwa validasi wajib diisi untuk field relasi saat ini belum didukung dalam konteks subformulir atau subtabel.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Penerapan aturan validasi
Setelah aturan field dikonfigurasi, aturan validasi yang sesuai akan dipicu saat menambahkan atau mengubah data.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Saat field digunakan dalam formulir, aturan validasi field juga akan ditampilkan dalam pengaturan validasi field. Aturan ini akan muncul di bawah 「Aturan validasi field sisi server」 dan hanya ditampilkan sebagai baca-saja di sini. Jika perlu mengubah aturan tersebut, kembali ke 「Konfigurasi sumber data / tabel data」 untuk mengedit field.

Anda tetap dapat menambahkan aturan tambahan untuk field formulir saat ini di bawah 「Aturan validasi sisi klien」. Aturan ini hanya memengaruhi komponen field saat ini. Aturan validasi yang berlaku pada akhirnya merupakan gabungan dari 「Aturan validasi field sisi server」 dan 「Aturan validasi sisi klien」.

Aturan validasi juga berlaku untuk komponen subtabel dan subformulir:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Perlu diperhatikan bahwa dalam konteks subformulir atau subtabel, validasi wajib diisi untuk field relasi saat ini belum berlaku.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Perbedaan antara aturan validasi field sisi server dan aturan validasi sisi klien
Aturan validasi field sisi server dan aturan validasi sisi klien dikonfigurasi di lokasi yang berbeda dan memiliki cakupan yang berbeda pula.

### Perbedaan metode konfigurasi
- **Aturan validasi field sisi server**: Mengatur aturan field di 「Konfigurasi sumber data / tabel data」. Aturan ini merupakan aturan dasar field
- **Aturan validasi sisi klien**: Menambahkan aturan tambahan dalam pengaturan field formulir. Aturan ini hanya memengaruhi komponen field saat ini
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Perbedaan waktu pemicu validasi
- **Aturan validasi field sisi server**: Saat field digunakan dalam formulir, validasi sisi depan akan dipicu, dan validasi juga akan dipicu sebelum data ditulis. Aturan ini juga diterapkan pada skenario penambahan atau perubahan data melalui alur kerja, impor data, dan lainnya
- **Aturan validasi sisi klien**: Validasi sisi depan hanya dipicu pada field formulir saat ini
- **Tampilan aturan**: Aturan validasi field sisi server akan ditampilkan sebagai aturan turunan dalam mode baca-saja. Aturan validasi sisi klien akan ditampilkan secara terpisah dan dapat diedit di sini
- **Pesan kesalahan**: Aturan validasi sisi klien mendukung pesan kesalahan khusus, sedangkan aturan validasi field sisi server saat ini belum mendukung pesan kesalahan khusus
