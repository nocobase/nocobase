---
pkg: '@nocobase/plugin-file-manager'
title: "Storage Engine: Aliyun OSS"
description: "Konfigurasi storage engine Aliyun OSS built-in NocoBase: region, AccessKey, bucket, timeout, cocok untuk Aliyun Object Storage Service."
keywords: "Aliyun OSS,Aliyun Storage,AccessKey,bucket,object storage,konfigurasi OSS,NocoBase"
---

# Storage Engine: Aliyun OSS

Storage engine berdasarkan Aliyun OSS, perlu menyiapkan akun dan permission terkait sebelum digunakan.


:::warning Perhatian

Engine ini tidak mendukung akses privat. Setelah file di-upload, NocoBase membuat URL yang dapat diakses langsung, dan siapa pun yang memiliki URL tersebut dapat mengakses file.

Meskipun bucket OSS disetel privat, engine bawaan Aliyun OSS tidak membuat URL bertanda tangan sementara untuk akses file. Jika memerlukan akses privat, gunakan [S3 Pro](./s3-pro.md). Jika file historis sudah ada, lihat [Migrasi ke S3 Pro](./migrate-to-s3-pro.md).

:::

## Parameter Konfigurasi

![Contoh konfigurasi storage engine Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Tips}
Hanya memperkenalkan parameter spesifik untuk Aliyun OSS storage engine. Untuk parameter umum lihat [Parameter Umum Engine](./index.md#parameter-umum-engine).
:::

### Base URL

Isi prefix URL akses file, seperti custom domain yang terikat ke bucket saat ini: `https://oss.example.com`. Mengakses PDF melalui domain default Aliyun OSS dapat membuat browser mengunduh file. Sebaiknya ikat custom domain terlebih dahulu. Lihat [Masalah umum](#masalah-umum) di bawah untuk detailnya.

### Region

Isi region storage OSS, contohnya: `oss-cn-hangzhou`.

:::info{title=Tips}
Anda dapat melihat informasi region storage space di [Aliyun OSS Console](https://oss.console.aliyun.com/), dan hanya perlu mengambil bagian prefix region saja (tidak perlu domain lengkap).
:::

### AccessKey ID

Isi ID Aliyun access key.

### AccessKey Secret

Isi Secret Aliyun access key.

### Bucket

Isi nama bucket OSS storage.

### Timeout

Isi timeout untuk upload ke Aliyun OSS, satuan milisecond, default `60000` milisecond (atau 60 detik).

## Masalah umum

### PDF di-download, bukan ditampilkan sebagai preview

NocoBase menampilkan PDF lintas origin dalam iframe. Browser mengakses URL file OSS secara langsung, sehingga response header OSS menentukan apakah file ditampilkan atau di-download.

Jika PDF di-download dari iframe, periksa request file di panel Network pada developer tools browser. Response yang bermasalah biasanya seperti ini:

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` sudah mengidentifikasi file dengan benar, tetapi `Content-Disposition: attachment` meminta browser untuk mengunduhnya. Domain default Aliyun OSS memaksa download dalam beberapa kondisi. Lihat dokumentasi resmi: [Mengatur PDF agar dipreview, bukan di-download](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded).

Sebaiknya gunakan konfigurasi berikut:

1. Ikuti [Mengakses resource OSS melalui custom domain](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names) untuk mengikat domain ke bucket
2. Konfigurasikan DNS dan sertifikat HTTPS, lalu pastikan custom domain dapat mengakses file secara langsung
3. Konfigurasikan URL akses pada storage engine NocoBase yang digunakan

Untuk langkah 3:

- Pada engine bawaan **Aliyun OSS**, isi **Base URL** dengan custom domain yang sudah diikat, misalnya `https://oss.example.com`
- Pada [S3 Pro](./s3-pro.md) yang terhubung ke Aliyun OSS, upload endpoint dapat tetap menggunakan endpoint regional OSS; isi access endpoint dengan custom domain dan atur `Full access URL style` menjadi `Ignore`

Upload PDF baru untuk memverifikasi konfigurasi. Jika record file lama menyimpan URL lengkap, pastikan juga URL yang dikembalikan ke frontend sudah menggunakan custom domain.

:::tip Periksa response header

Preview PDF lintas origin dalam iframe tidak memerlukan CORS. Apakah PDF dapat ditampilkan inline terutama ditentukan oleh `Content-Type` dan `Content-Disposition`. Hal ini berbeda dari persyaratan CORS untuk tombol download di bawah.

:::

### Gambar dapat dipreview, tetapi tombol download menampilkan error CORS

Gambar biasanya dipreview dengan `<img>`, sedangkan PDF lintas origin dengan iframe. Keduanya dapat menampilkan resource tanpa CORS response header. Namun, tombol download membaca file dengan `fetch` lalu membuat Blob. Request ini dibatasi oleh same-origin policy browser.

Error berikut berarti OSS tidak mengembalikan `Access-Control-Allow-Origin` untuk situs NocoBase saat ini:

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Ikuti panduan resmi [Mengonfigurasi CORS](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing) dan buat rule untuk bucket. Untuk download dari komponen preview, gunakan nilai seperti berikut:

| Pengaturan | Nilai yang disarankan |
| --- | --- |
| Allowed Origins | Origin lengkap NocoBase, misalnya `https://example.com` |
| Allowed Methods | `GET`, `HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`, `Content-Disposition` |
| MaxAgeSeconds | `600` |

Jika S3 Pro juga meng-upload file langsung dari browser, tambahkan method seperti `PUT` dan `POST` berdasarkan request upload yang terlihat di panel Network, atau buat rule upload terpisah.

Setelah rule disimpan, request kembali file menggunakan origin situs NocoBase. Response setidaknya harus berisi:

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

Browser mungkin sudah menyimpan response preview gambar dalam cache. Request tersebut tidak membawa header `Origin`, dan response cache mungkin tidak memiliki `Access-Control-Allow-Origin`. Jika download masih gagal setelah CORS dikonfigurasi, hapus cache browser untuk file tersebut atau aktifkan **Disable cache** di developer tools, lalu coba lagi.

### Memverifikasi response header

Gunakan `curl` untuk mensimulasikan request lintas origin dari situs NocoBase. Ganti origin, URL file, dan parameter signature pada contoh dengan nilai sebenarnya:

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

Periksa hasil berikut:

- Preview PDF mengembalikan `Content-Type: application/pdf` tanpa `Content-Disposition: attachment`
- Download lintas origin mengembalikan `Access-Control-Allow-Origin` yang sesuai dengan situs NocoBase
- URL file sebenarnya menggunakan custom domain, bukan domain default `*.oss-cn-*.aliyuncs.com`

Request tanpa header `Origin` yang tidak menerima CORS response header adalah kondisi normal. Pertahankan header `Origin` pada contoh saat memverifikasi CORS.

## Link terkait

- [File Preview](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [Migrasi ke S3 Pro](./migrate-to-s3-pro.md)
- [Storage Engine](./index.md)
