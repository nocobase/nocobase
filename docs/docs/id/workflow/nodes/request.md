---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Permintaan HTTP

## Pendahuluan

Saat Anda perlu berinteraksi dengan sistem web lain, Anda dapat menggunakan node Permintaan HTTP. Ketika dieksekusi, node ini akan mengirimkan permintaan HTTP ke alamat yang ditentukan sesuai dengan konfigurasinya. Node ini dapat membawa data dalam format JSON atau `application/x-www-form-urlencoded` untuk berinteraksi dengan sistem eksternal.

Jika Anda sudah familiar dengan alat pengirim permintaan seperti Postman, Anda akan dengan cepat menguasai penggunaan node Permintaan HTTP. Berbeda dengan alat-alat tersebut, semua parameter dalam node Permintaan HTTP dapat menggunakan variabel konteks dari **alur kerja** saat ini, memungkinkan integrasi yang organik dengan proses bisnis sistem Anda.

## Instalasi

**Plugin** bawaan, tidak perlu instalasi.

## Membuat Node

Di antarmuka konfigurasi **alur kerja**, klik tombol plus ("+") pada alur untuk menambahkan node "Permintaan HTTP":

![Tambah Permintaan HTTP](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Konfigurasi Node

![Konfigurasi Node Permintaan HTTP](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Metode Permintaan

Metode permintaan HTTP yang tersedia: `GET`, `POST`, `PUT`, `PATCH`, dan `DELETE`.

### URL Permintaan

URL layanan HTTP, harus menyertakan bagian protokol (`http://` atau `https://`). Penggunaan `https://` sangat direkomendasikan.

### Format Data Permintaan

Ini adalah `Content-Type` dalam header permintaan. Untuk format yang didukung, lihat bagian "[Isi Permintaan](#isi-permintaan)".

### Konfigurasi Header Permintaan

Pasangan kunci-nilai untuk bagian Header permintaan. Nilai-nilai terkait dapat menggunakan variabel dari konteks **alur kerja**.

:::info{title=Tips}
Header permintaan `Content-Type` telah dikonfigurasi melalui format data permintaan. Anda tidak perlu mengisinya di sini, dan setiap penimpaan akan tidak efektif.
:::

### Parameter Permintaan

Pasangan kunci-nilai untuk bagian *query* permintaan. Nilai-nilai terkait dapat menggunakan variabel dari konteks **alur kerja**.

### Isi Permintaan

Bagian Body dari permintaan. Format yang berbeda didukung tergantung pada `Content-Type` yang dipilih.

#### `application/json`

Mendukung teks berformat JSON standar. Anda dapat menyisipkan variabel dari konteks **alur kerja** menggunakan tombol variabel di sudut kanan atas editor teks.

:::info{title=Tips}
Variabel harus digunakan di dalam string JSON, contohnya: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Format pasangan kunci-nilai. Nilai-nilai dapat menggunakan variabel dari konteks **alur kerja**. Ketika variabel disertakan, variabel tersebut akan diurai sebagai *template* string dan digabungkan menjadi nilai string akhir.

#### `application/xml`

Mendukung teks berformat XML standar. Anda dapat menyisipkan variabel dari konteks **alur kerja** menggunakan tombol variabel di sudut kanan atas editor teks.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Mendukung pasangan kunci-nilai untuk data formulir. File dapat diunggah ketika tipe data diatur ke objek file. File hanya dapat dipilih melalui variabel dari objek file yang sudah ada dalam konteks, seperti hasil kueri pada **koleksi** file atau data terkait dari **koleksi** file yang berasosiasi.

:::info{title=Tips}
Saat memilih data file, pastikan variabel sesuai dengan satu objek file, bukan daftar file (dalam kueri relasi satu-ke-banyak atau banyak-ke-banyak, nilai bidang relasi akan berupa *array*).
:::

### Pengaturan *Timeout*

Ketika permintaan tidak merespons dalam waktu lama, pengaturan *timeout* dapat digunakan untuk membatalkan eksekusinya. Jika permintaan *timeout*, **alur kerja** saat ini akan dihentikan lebih awal dengan status gagal.

### Abaikan Kegagalan

Node permintaan menganggap kode status HTTP standar antara `200` hingga `299` (inklusif) sebagai status berhasil, dan semua kode lainnya sebagai gagal. Jika opsi "Abaikan permintaan gagal dan lanjutkan **alur kerja**" dicentang, node-node **alur kerja** berikutnya akan tetap dieksekusi meskipun permintaan gagal.

## Menggunakan Hasil Respons

Hasil respons dari permintaan HTTP dapat diurai oleh node [Kueri JSON](./json-query.md) untuk digunakan oleh node-node berikutnya.

Sejak versi `v1.0.0-alpha.16`, tiga bagian dari hasil respons node permintaan dapat digunakan sebagai variabel terpisah:

*   Kode status respons
*   Header respons
*   Data respons

![Node Permintaan HTTP_Menggunakan Hasil Respons](https://static-docs.nocobase.com/20240529110610.png)

Kode status respons biasanya adalah kode status HTTP standar dalam bentuk numerik, seperti `200`, `403`, dll. (diberikan oleh penyedia layanan).

Header respons (Response headers) dalam format JSON. Baik header maupun data respons berformat JSON masih perlu diurai menggunakan node JSON sebelum dapat digunakan.

## Contoh

Contohnya, kita dapat menggunakan node permintaan untuk terhubung dengan platform *cloud* guna mengirimkan SMS notifikasi. Konfigurasi untuk API pengiriman SMS *cloud* (misalnya, Alibaba Cloud) mungkin terlihat seperti berikut (Anda perlu merujuk dokumentasi API spesifik untuk menyesuaikan parameternya):

![Node Permintaan HTTP_Konfigurasi](https://static-docs.nocobase.com/20240515124004.png)

Ketika **alur kerja** memicu eksekusi node ini, ia akan memanggil API SMS Alibaba Cloud dengan konten yang telah dikonfigurasi. Jika permintaan berhasil, sebuah SMS akan dikirimkan melalui layanan SMS *cloud*.