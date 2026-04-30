---
pkg: "@nocobase/plugin-field-encryption"
title: "Enkripsi Field"
description: "Mengenkripsi data bisnis privat (nomor telepon, email, nomor kartu, dan lainnya) untuk penyimpanan, disimpan dalam bentuk ciphertext ke database, melindungi informasi sensitif."
keywords: "enkripsi field,Encryption,data sensitif,penyimpanan ciphertext,NocoBase"
---
# Enkripsi

## Pengantar

Beberapa data bisnis privat, seperti nomor telepon pelanggan, alamat email, nomor kartu, dan lainnya, dapat dienkripsi. Setelah dienkripsi, data akan disimpan ke database dalam bentuk ciphertext.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Cara Enkripsi

:::warning
Plugin akan otomatis menghasilkan satu `Application Key`, kunci ini disimpan di direktori `/storage/apps/main/encryption-field-keys`.

Nama file `Application Key` adalah ID kunci, dengan ekstensi `.key`. Harap jangan mengubah nama file secara sembarangan.

Harap simpan file `Application Key` dengan baik. Jika file `Application Key` hilang, data terenkripsi tidak dapat didekripsi.

Jika sub-aplikasi yang mengaktifkan plugin, kunci akan disimpan di direktori default `/storage/apps/${nama_sub_aplikasi}/encryption-field-keys`
:::

### Prinsip Kerja

Menggunakan metode envelope encryption

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Alur Pembuatan Kunci
1. Saat field terenkripsi pertama kali dibuat, sistem akan otomatis menghasilkan `Application Key` 32-bit, disimpan ke direktori penyimpanan default dengan encoding base64.
2. Setiap kali field terenkripsi baru dibuat, akan dihasilkan `Field Key` random 32-bit untuk field ini, lalu dienkripsi dengan `Application Key` dan `Field Initialization Vector` random 16-bit (algoritma enkripsi `AES`), lalu disimpan di field `options` dari tabel `fields`.

### Alur Enkripsi Field
1. Setiap kali data ditulis ke field terenkripsi, `Field Key` terenkripsi dan `Field Initialization Vector` akan diambil terlebih dahulu dari field `options` tabel `fields`.
2. Gunakan `Application Key` dan `Field Initialization Vector` untuk mendekripsi `Field Key` yang sudah dienkripsi, lalu gunakan `Field Key` dan `Data Initialization Vector` random 16-bit untuk mengenkripsi data (algoritma enkripsi `AES`).
3. Gunakan `Field Key` yang sudah didekripsi untuk men-sign data (algoritma digest `HMAC-SHA256`), dan dikonversi ke string dengan encoding base64 (`Data Signature` yang dihasilkan akan digunakan kemudian untuk pencarian data).
4. Gabungkan `Data Initialization Vector` 16-bit dan `Data Ciphertext` yang sudah dienkripsi secara biner, dikonversi ke string dengan encoding base64.
5. Gabungkan string encoding base64 `Data Signature` dan string encoding base64 `Data Ciphertext` yang sudah digabung, dipisahkan dengan '.'.
6. Simpan string final yang sudah digabung ke database.


## Environment Variable

Jika Anda ingin menentukan `Application Key`, dapat menggunakan environment variable `ENCRYPTION_FIELD_KEY_PATH`. Plugin akan memuat file pada path tersebut sebagai `Application Key`.

Persyaratan format file `Application Key`:
1. Ekstensi file harus `.key`.
2. Nama file akan digunakan sebagai ID kunci, sebaiknya menggunakan uuid untuk memastikan keunikan.
3. Konten file adalah data biner 32-bit dengan encoding base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Konfigurasi Field

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Pengaruh terhadap Filter setelah Enkripsi

Field yang sudah dienkripsi hanya mendukung: equal, not equal, exist, not exist.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Cara filter data:
1. Ambil `Field Key` dari field terenkripsi, gunakan `Application Key` untuk mendekripsi `Field Key`.
2. Gunakan `Field Key` untuk men-sign teks pencarian yang diinput pengguna (algoritma digest `HMAC-SHA256`).
3. Gunakan teks pencarian yang sudah di-sign dengan separator `.`, untuk melakukan pencarian prefix matching pada field terenkripsi di database.

## Rotasi Kunci

:::warning
Sebelum menggunakan perintah rotasi kunci `nocobase key-rotation`, pastikan aplikasi sudah memuat plugin ini.
:::

Setelah aplikasi dimigrasi ke environment baru, jika Anda tidak ingin terus menggunakan kunci yang sama dengan environment lama, dapat menggunakan perintah `nocobase key-rotation` untuk mengganti `Application Key`.

Menjalankan perintah rotasi kunci memerlukan penentuan Application Key dari environment lama. Setelah perintah dijalankan, akan dihasilkan Application Key baru, dan menggantikan kunci lama. Application Key baru akan disimpan ke direktori penyimpanan default dengan encoding base64.

```bash
# --key-path menunjukkan file Application Key dari environment lama yang sesuai dengan data terenkripsi di database
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Jika mengganti `Application Key` sub-aplikasi, perlu menambahkan parameter `--app-name`, untuk menentukan `name` sub-aplikasi

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
