---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Enkripsi

## Pendahuluan

Beberapa data bisnis yang bersifat pribadi, seperti nomor ponsel pelanggan, alamat email, atau nomor kartu, dapat dienkripsi. Setelah dienkripsi, data akan disimpan ke dalam database dalam bentuk ciphertext.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Metode Enkripsi

:::warning
`Plugin` akan secara otomatis menghasilkan `kunci aplikasi` yang disimpan di direktori `/storage/apps/main/encryption-field-keys`.

Nama file `kunci aplikasi` adalah ID kunci dengan ekstensi `.key`. Mohon jangan mengubah nama file secara sembarangan.

Harap simpan file `kunci aplikasi` dengan aman. Jika Anda kehilangan file `kunci aplikasi`, data terenkripsi tidak akan dapat didekripsi.

Jika `plugin` diaktifkan oleh sub-aplikasi, kunci akan disimpan secara default di direktori `/storage/apps/${nama-sub-aplikasi}/encryption-field-keys`.
:::

### Cara Kerja

Menggunakan metode Enkripsi Amplop (Envelope Encryption).

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proses Pembuatan Kunci
1. Saat pertama kali membuat bidang terenkripsi, sistem akan secara otomatis menghasilkan `kunci aplikasi` 32-bit dan menyimpannya ke direktori penyimpanan default dalam format Base64.
2. Setiap kali bidang terenkripsi baru dibuat, `kunci bidang` 32-bit acak akan dihasilkan untuk bidang tersebut. Kemudian, kunci tersebut dienkripsi menggunakan `kunci aplikasi` dan `vektor enkripsi bidang` 16-bit yang dihasilkan secara acak (algoritma enkripsi `AES`), lalu disimpan ke dalam kolom `options` pada tabel `fields`.

### Proses Enkripsi Bidang
1. Setiap kali Anda menulis data ke bidang terenkripsi, `kunci bidang` dan `vektor enkripsi bidang` yang terenkripsi akan diambil terlebih dahulu dari kolom `options` pada tabel `fields`.
2. Menggunakan `kunci aplikasi` dan `vektor enkripsi bidang` untuk mendekripsi `kunci bidang` yang terenkripsi. Kemudian, data dienkripsi menggunakan `kunci bidang` dan `vektor enkripsi data` 16-bit yang dihasilkan secara acak (algoritma enkripsi `AES`).
3. Data ditandatangani menggunakan `kunci bidang` yang telah didekripsi (algoritma digest `HMAC-SHA256`) dan dikonversi menjadi string dengan pengodean Base64 (`tanda tangan data` yang dihasilkan selanjutnya akan digunakan untuk pengambilan data).
4. Menggabungkan `vektor enkripsi data` 16-bit dan `ciphertext` yang terenkripsi secara biner, lalu mengonversinya menjadi string dengan pengodean Base64.
5. Menggabungkan string `tanda tangan data` yang dienkode Base64 dan string `ciphertext` yang dienkode Base64 yang telah digabungkan, dengan pemisah `.`.
6. Menyimpan string gabungan akhir ke dalam database.

## Variabel Lingkungan

Jika Anda ingin menentukan `kunci aplikasi`, Anda dapat menggunakan variabel lingkungan `ENCRYPTION_FIELD_KEY_PATH`. `Plugin` akan memuat file pada jalur tersebut sebagai `kunci aplikasi`.

Persyaratan format file kunci aplikasi:
1. Ekstensi file harus `.key`.
2. Nama file akan digunakan sebagai ID kunci; disarankan menggunakan UUID untuk memastikan keunikan.
3. Isi file harus berupa data biner 32-bit yang dienkode Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Konfigurasi Bidang

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Dampak Enkripsi pada Pemfilteran

Bidang yang terenkripsi hanya mendukung operasi: sama dengan, tidak sama dengan, ada, tidak ada.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Metode Pemfilteran Data:
1. Mengambil `kunci bidang` dari bidang terenkripsi, lalu mendekripsinya menggunakan `kunci aplikasi`.
2. Menggunakan `kunci bidang` untuk menandatangani teks pencarian yang dimasukkan pengguna (algoritma digest `HMAC-SHA256`).
3. Menggabungkan teks pencarian yang telah ditandatangani dengan pemisah `.`, lalu melakukan pencarian dengan pencocokan awalan (prefix-match) pada bidang terenkripsi di database.

## Rotasi Kunci

:::warning
Sebelum menggunakan perintah rotasi kunci `nocobase key-rotation`, pastikan `plugin` ini telah dimuat oleh aplikasi.
:::

Ketika aplikasi dimigrasikan ke lingkungan baru dan Anda tidak ingin terus menggunakan kunci yang sama dengan lingkungan lama, Anda dapat menggunakan perintah `nocobase key-rotation` untuk mengganti `kunci aplikasi`.

Menjalankan perintah rotasi kunci memerlukan penentuan `kunci aplikasi` dari lingkungan lama. Setelah perintah dijalankan, `kunci aplikasi` baru akan dihasilkan dan menggantikan kunci lama. `Kunci aplikasi` baru akan disimpan dalam format Base64 ke direktori penyimpanan default.

```bash
# --key-path menentukan file kunci aplikasi lingkungan lama yang sesuai dengan data terenkripsi di database
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Jika Anda ingin mengganti `kunci aplikasi` sub-aplikasi, Anda perlu menambahkan parameter `--app-name` untuk menentukan `nama` sub-aplikasi.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```