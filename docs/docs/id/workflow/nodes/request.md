---
pkg: '@nocobase/plugin-workflow-request'
title: "Node Workflow - HTTP Request"
description: "Node HTTP Request: berinteraksi dengan sistem web eksternal, mengirim request berformat JSON atau form-urlencoded."
keywords: "Workflow,HTTP Request,Request,sistem eksternal,panggilan API,NocoBase"
---

# HTTP Request

## Pengantar

Saat Anda perlu berinteraksi dengan sistem web lain, Anda dapat menggunakan Node HTTP Request. Node ini saat dieksekusi akan mengirimkan HTTP request ke alamat yang sesuai berdasarkan konfigurasi, dapat membawa data dalam format JSON atau `application/x-www-form-urlencoded`, untuk menyelesaikan pertukaran data dengan sistem eksternal.

Jika Anda familier dengan tool pengirim request seperti Postman, Anda akan cepat menguasai cara penggunaan Node HTTP Request. Berbeda dengan tool tersebut, setiap parameter pada Node HTTP Request dapat menggunakan variable konteks dari alur saat ini, sehingga dapat dikombinasikan secara organik dengan pemrosesan bisnis sistem saat ini.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Pada antarmuka konfigurasi workflow, klik tombol plus ("+") pada alur untuk menambahkan Node "HTTP Request":

![HTTP Request_Tambah](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Konfigurasi Node

![Node HTTP Request_Konfigurasi](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Method Request

Method HTTP request yang dapat dipilih: `GET`, `POST`, `PUT`, `PATCH`, dan `DELETE`.

### URL Request

URL layanan HTTP, harus menyertakan bagian protokol (`http://` atau `https://`), disarankan menggunakan `https://`.

### Format Data Request

Yaitu `Content-Type` pada request header, untuk format yang didukung lihat bagian "[Body Request](#body-request)".

### Konfigurasi Header Request

Pasangan key-value bagian Header request, value dapat menggunakan variable konteks alur.

:::info{title=Tips}
Untuk header `Content-Type` sudah dikonfigurasi melalui format data request, tidak perlu diisi, dan jika di-override tidak akan berlaku.
:::

### Parameter Request

Pasangan key-value bagian query request, value dapat menggunakan variable konteks alur.

### Body Request

Bagian Body dari request, mendukung format yang berbeda berdasarkan `Content-Type` yang dipilih.

#### `application/json`

Mendukung teks dengan format JSON standar, Anda dapat menyisipkan variable konteks alur melalui tombol variable di pojok kanan atas kotak editor teks.

:::info{title=Tips}
Variable harus digunakan di dalam string JSON, contoh: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Format pasangan key-value, value dapat menggunakan variable konteks alur. Saat berisi variable, akan diparse sebagai template string dan digabungkan menjadi nilai string final.

#### `application/xml`

Mendukung teks dengan format XML standar, Anda dapat menyisipkan variable konteks alur melalui tombol variable di pojok kanan atas kotak editor teks.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Mendukung pasangan key-value data form, dapat upload file saat tipe data dipilih sebagai objek file. File hanya dapat dipilih melalui variable yang merupakan objek file yang sudah ada pada konteks, seperti hasil query tabel file, atau data relasi yang berelasi dengan tabel file.

:::info{title=Tips}
Saat memilih data file, pastikan variable yang sesuai adalah objek file tunggal, bukan list file (pada query relasi to-many, value field relasi adalah array).
:::

### Pengaturan Timeout

Saat request tidak menerima response dalam waktu lama, melalui pengaturan timeout request akan dibatalkan. Setelah timeout, alur saat ini akan dihentikan lebih awal dengan status gagal.

### Abaikan Kegagalan

Node Request menganggap status standar HTTP `200`~`299` (inklusif) sebagai sukses, lainnya dianggap gagal. Jika opsi "abaikan request yang gagal dan lanjutkan workflow" dicentang, maka saat request gagal, eksekusi Node alur lainnya akan tetap dilanjutkan.

## Menggunakan Hasil Response

Hasil response HTTP request dapat diparse melalui Node [JSON Query](./json-query.md) untuk digunakan oleh Node berikutnya.

Sejak versi `v1.0.0-alpha.16`, tiga bagian dari hasil response Node Request dapat digunakan sebagai variable secara terpisah:

* Status code response
* Header response
* Data response

![Node HTTP Request_Penggunaan Hasil Response](https://static-docs.nocobase.com/20240529110610.png)

Status code response biasanya dalam bentuk angka standar HTTP status code, seperti `200`, `403` dll. (sesuai dengan yang diberikan oleh penyedia layanan).

Header response dalam format JSON. Termasuk data response dalam format JSON, masih perlu diparse menggunakan Node JSON sebelum digunakan.

## Contoh

Misalnya kita dapat menggunakan Node Request untuk terintegrasi dengan platform cloud untuk mengirim SMS notifikasi, dengan contoh interface SMS Aliyun, konfigurasinya sebagai berikut (parameter terkait perlu disesuaikan berdasarkan dokumentasi):

![Node HTTP Request_Konfigurasi](https://static-docs.nocobase.com/20240515124004.png)

Saat workflow memicu Node ini untuk dieksekusi, akan memanggil interface SMS Aliyun dengan isi yang dikonfigurasi. Jika request berhasil, akan mengirim sebuah SMS melalui layanan cloud SMS.
