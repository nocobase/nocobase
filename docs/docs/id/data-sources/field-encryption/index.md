---
pkg: "@nocobase/plugin-field-encryption"
title: "Enkripsi bidang"
description: "Menyimpan data bisnis rahasia (seperti nomor ponsel, email, nomor kartu, dll.) secara terenkripsi dalam basis data untuk melindungi informasi sensitif."
keywords: "Enkripsi bidang,Encryption,data sensitif,penyimpanan terenkripsi,NocoBase"
---
<!-- translation-inline-code: `应用密钥` `/storage/apps/main/encryption-field-keys` `应用密钥` `.key` `应用密钥` `应用密钥` `/storage/apps/${子应用name}/encryption-field-keys` `应用密钥` `字段密钥` `应用密钥` `字段加密向量` `AES` `fields` `options` `fields` `options` `字段密钥` `字段加密向量` `应用密钥` `字段加密向量` `字段密钥` `字段密钥` `数据加密向量` `AES` `字段密钥` `HMAC-SHA256` `数据签名` `数据加密向量` `数据密文` `数据签名` `数据密文` `应用密钥` `ENCRYPTION_FIELD_KEY_PATH` `应用密钥` `应用密钥` `.key` `字段密钥` `应用密钥` `字段密钥` `字段密钥` `HMAC-SHA256` `.` `nocobase key-rotation` `nocobase key-rotation` `应用密钥` `应用密钥` `--app-name` `name` -->
# Enkripsi

## Pengenalan

Beberapa data bisnis rahasia, seperti nomor ponsel pelanggan, alamat email, nomor kartu, dan sebagainya, dapat dienkripsi. Setelah dienkripsi, data disimpan dalam basis data dalam bentuk teks sandi.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Metode enkripsi

:::warning
Plugin akan secara otomatis menghasilkan sebuah , dan kunci tersebut disimpan di direktori .

Nama file  adalah ID kunci, dengan ekstensi . Jangan mengubah nama file sembarangan.

Simpan file  dengan baik. Jika file  hilang, data terenkripsi tidak dapat didekripsi.

Jika plugin diaktifkan pada sub-aplikasi, direktori penyimpanan kunci default adalah
:::

### Prinsip kerja

Menggunakan enkripsi amplop

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proses pembuatan kunci
1. Saat pertama kali membuat bidang terenkripsi, sistem akan secara otomatis menghasilkan sebuah  32-bit, yang disimpan dalam direktori penyimpanan default dengan pengodean base64.
2. Setiap kali membuat bidang terenkripsi baru, sebuah  acak 32-bit akan dibuat untuk bidang tersebut, lalu dienkripsi menggunakan  dan  acak 16-bit (algoritme enkripsi ), kemudian disimpan ke bidang  pada tabel .

### Proses enkripsi bidang
1. Setiap kali data ditulis ke bidang terenkripsi,  dan  terenkripsi akan terlebih dahulu diambil dari bidang options pada tabel fields.
2. Gunakan  dan  untuk mendekripsi  yang telah dienkripsi, lalu gunakan  dan  acak 16-bit untuk mengenkripsi data (algoritme enkripsi ).
3. Gunakan  yang telah didekripsi untuk menandatangani data (algoritme ringkasan ), lalu ubah menjadi string dengan pengodean base64 ( yang dihasilkan akan digunakan kemudian untuk pencarian data).
4. Gabungkan secara biner  16-bit dan  terenkripsi, lalu ubah menjadi string dengan pengodean base64.
5. Gabungkan string berpengodean base64  dan string berpengodean base64  yang telah digabungkan menggunakan pemisah '.'.
6. Simpan string gabungan akhir ke dalam basis data.


## Variabel lingkungan

Jika ingin menentukan , Anda dapat menggunakan variabel lingkungan . Plugin akan memuat file pada jalur tersebut sebagai .

Persyaratan format file :
1. Ekstensi file harus .
2. Nama file akan digunakan sebagai ID kunci; sebaiknya gunakan uuid untuk memastikan keunikan.
3. Isi file berupa data biner 32-bit yang dikodekan dengan base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Konfigurasi bidang

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Dampak enkripsi terhadap pemfilteran

Bidang terenkripsi hanya mendukung: sama dengan, tidak sama dengan, ada, tidak ada.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Metode pemfilteran data:
1. Ambil  dari bidang terenkripsi, lalu gunakan  untuk mendekripsi .
2. Gunakan  untuk menandatangani teks pencarian yang dimasukkan pengguna (algoritme ringkasan ).
3. Gabungkan teks pencarian yang telah ditandatangani dengan pemisah , lalu lakukan pencarian kecocokan awalan pada bidang terenkripsi dalam basis data.

## Rotasi kunci

:::warning
Sebelum menggunakan perintah rotasi kunci , pastikan aplikasi telah memuat plugin ini.
:::

Setelah aplikasi dimigrasikan ke lingkungan baru, jika tidak ingin terus menggunakan kunci yang sama dengan lingkungan lama, Anda dapat menggunakan perintah  untuk mengganti .

Menjalankan perintah rotasi kunci memerlukan penentuan kunci aplikasi dari lingkungan lama. Setelah perintah dijalankan, kunci aplikasi baru akan dibuat dan menggantikan kunci lama. Kunci aplikasi baru disimpan di direktori penyimpanan default dengan pengodean base64.

```bash
# --key-path 指定的是和数据库加密数据对应的旧环境的应用密钥文件
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Jika mengganti  sub-aplikasi, Anda perlu menambahkan parameter  untuk menentukan  sub-aplikasi.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
