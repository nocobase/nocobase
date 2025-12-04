---
pkg: '@nocobase/plugin-workflow-aggregate'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Kueri Agregat

## Pendahuluan

Digunakan untuk menjalankan fungsi kueri agregat pada data dalam sebuah koleksi yang memenuhi kondisi tertentu, lalu mengembalikan hasil statistik yang sesuai. Ini sering dipakai untuk memproses data statistik terkait laporan.

Implementasi node ini didasarkan pada fungsi agregat database. Saat ini, node hanya mendukung statistik pada satu bidang dari sebuah koleksi. Hasil numerik statistik akan disimpan dalam output node untuk digunakan oleh node berikutnya.

## Instalasi

Plugin bawaan, tidak perlu instalasi.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus (“+”) di alur untuk menambahkan node “Kueri Agregat”:

![Membuat Node Kueri Agregat](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Konfigurasi Node

![Konfigurasi Node Kueri Agregat](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Fungsi Agregat

Mendukung 5 fungsi agregat dari SQL: `COUNT`, `SUM`, `AVG`, `MIN`, dan `MAX`. Pilih salah satunya untuk menjalankan kueri agregat pada data.

### Tipe Target

Target kueri agregat dapat dipilih dalam dua mode. Pertama, dengan langsung memilih koleksi target dan salah satu bidangnya. Kedua, dengan memilih koleksi terkait relasi satu-ke-banyak dan bidangnya melalui objek data yang sudah ada dalam konteks alur kerja untuk menjalankan kueri agregat.

### Distinct

Ini adalah `DISTINCT` dalam SQL. Bidang untuk deduplikasi sama dengan bidang koleksi yang dipilih. Saat ini, memilih bidang yang berbeda untuk keduanya belum didukung.

### Kondisi Filter

Mirip dengan kondisi filter dalam kueri koleksi biasa, Anda dapat menggunakan variabel konteks dari alur kerja.

## Contoh

Target agregat “data koleksi” relatif mudah dipahami. Di sini, kami akan menggunakan contoh “menghitung total jumlah artikel dalam sebuah kategori setelah artikel baru ditambahkan” untuk memperkenalkan penggunaan target agregat “data koleksi terkait”.

Pertama, buat dua koleksi: “Artikel” dan “Kategori”. Koleksi Artikel memiliki bidang relasi banyak-ke-satu yang menunjuk ke koleksi Kategori, dan bidang relasi terbalik satu-ke-banyak juga dibuat dari Kategori ke Artikel:

| Nama Bidang    | Tipe                   |
| -------------- | ---------------------- |
| Judul          | Teks Satu Baris        |
| Kategori       | Banyak-ke-Satu (Kategori) |

| Nama Bidang    | Tipe                 |
| -------------- | -------------------- |
| Nama Kategori  | Teks Satu Baris      |
| Artikel        | Satu-ke-Banyak (Artikel) |

Selanjutnya, buat alur kerja yang dipicu oleh peristiwa koleksi. Pilih untuk memicunya setelah data baru ditambahkan ke koleksi Artikel.

Kemudian, tambahkan node kueri agregat dan konfigurasikan seperti berikut:

![Konfigurasi Node Kueri Agregat_Contoh](https://static-docs.nocobase.com/542272e638c6c0a567373d1b37ddda78.png)

Dengan demikian, setelah alur kerja dipicu, node kueri agregat akan menghitung jumlah semua artikel dalam kategori artikel yang baru ditambahkan dan menyimpannya sebagai hasil node.

:::info{title=Tips}
Jika Anda perlu menggunakan data relasi dari pemicu peristiwa koleksi, Anda harus mengonfigurasi bidang terkait di bagian “Muat data terkait terlebih dahulu” pada pemicu, jika tidak, data tersebut tidak dapat dipilih.
:::