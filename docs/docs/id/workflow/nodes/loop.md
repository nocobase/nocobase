---
pkg: '@nocobase/plugin-workflow-loop'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Perulangan

## Pendahuluan

Perulangan setara dengan struktur sintaks seperti `for`/`while`/`forEach` dalam bahasa pemrograman. Ketika Anda perlu mengulang beberapa operasi dalam jumlah tertentu atau untuk suatu **koleksi** data (array), Anda dapat menggunakan node perulangan.

## Instalasi

Ini adalah **plugin** bawaan dan tidak memerlukan instalasi.

## Membuat Node

Di antarmuka konfigurasi **alur kerja**, klik tombol plus ("+") di alur untuk menambahkan node "Perulangan":

![Membuat Node Perulangan](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Setelah membuat node perulangan, sebuah cabang di dalam perulangan akan dibuat. Anda dapat menambahkan sejumlah node di dalam cabang ini. Node-node ini tidak hanya dapat menggunakan variabel dari konteks **alur kerja**, tetapi juga variabel lokal dari konteks perulangan, misalnya, objek data yang diulang dalam **koleksi** perulangan, atau indeks hitungan perulangan (indeks dimulai dari `0`). Cakupan variabel lokal terbatas di dalam perulangan. Jika ada perulangan bertingkat, Anda dapat menggunakan variabel lokal dari perulangan spesifik di setiap tingkatan.

## Konfigurasi Node

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Objek Perulangan

Perulangan akan menangani tipe data objek perulangan yang berbeda dengan cara yang berbeda:

1.  **Array**: Ini adalah kasus yang paling umum. Anda biasanya dapat memilih variabel dari konteks **alur kerja**, seperti beberapa hasil data dari node kueri, atau data relasi banyak-ke-satu yang dimuat sebelumnya. Jika array dipilih, node perulangan akan mengulang setiap elemen dalam array, menetapkan elemen saat ini ke variabel lokal dalam konteks perulangan untuk setiap iterasi.

2.  **Angka**: Ketika variabel yang dipilih adalah angka, angka tersebut akan digunakan sebagai jumlah iterasi. Nilai angka hanya mendukung bilangan bulat positif; angka negatif tidak akan masuk ke perulangan, dan bagian desimal dari angka akan diabaikan. Indeks hitungan perulangan dalam variabel lokal juga merupakan nilai objek perulangan. Nilai ini dimulai dari **0**. Misalnya, jika objek perulangan adalah angka 5, objek dan indeks dalam setiap perulangan akan secara berurutan: 0, 1, 2, 3, 4.

3.  **String**: Ketika variabel yang dipilih adalah string, panjangnya akan digunakan sebagai jumlah iterasi, memproses setiap karakter dari string berdasarkan indeks.

4.  **Lainnya**: Tipe nilai lain (termasuk tipe objek) diperlakukan sebagai objek perulangan satu item dan hanya akan berulang sekali. Situasi ini biasanya tidak memerlukan perulangan.

Selain memilih variabel, Anda juga dapat langsung memasukkan konstanta untuk tipe angka dan string. Misalnya, memasukkan `5` (tipe angka) akan menyebabkan node perulangan berulang 5 kali. Memasukkan `abc` (tipe string) akan menyebabkan node perulangan berulang 3 kali, memproses karakter `a`, `b`, dan `c` secara berurutan. Di alat pemilihan variabel, pilih tipe yang diinginkan untuk konstanta.

### Kondisi Perulangan

Sejak versi `v1.4.0-beta`, opsi terkait kondisi perulangan telah ditambahkan. Anda dapat mengaktifkan kondisi perulangan di konfigurasi node.

**Kondisi**

Mirip dengan konfigurasi kondisi di node kondisi, Anda dapat menggabungkan konfigurasi dan menggunakan variabel dari perulangan saat ini, seperti objek perulangan, indeks perulangan, dll.

**Waktu Pengecekan**

Mirip dengan konstruksi `while` dan `do/while` dalam bahasa pemrograman, Anda dapat memilih untuk mengevaluasi kondisi yang dikonfigurasi sebelum setiap perulangan dimulai atau setelah setiap perulangan berakhir. Evaluasi kondisi pasca-perulangan memungkinkan node lain di dalam badan perulangan untuk dieksekusi satu putaran sebelum kondisi diperiksa.

**Ketika Kondisi Tidak Terpenuhi**

Mirip dengan pernyataan `break` dan `continue` dalam bahasa pemrograman, Anda dapat memilih untuk keluar dari perulangan atau melanjutkan ke iterasi berikutnya.

### Penanganan Kesalahan pada Node di Dalam Perulangan

Sejak versi `v1.4.0-beta`, ketika node di dalam perulangan gagal dieksekusi (karena kondisi tidak terpenuhi, kesalahan, dll.), Anda dapat mengonfigurasi alur selanjutnya. Tiga metode penanganan didukung:

*   Keluar dari **alur kerja** (seperti `throw` dalam pemrograman)
*   Keluar dari perulangan dan melanjutkan **alur kerja** (seperti `break` dalam pemrograman)
*   Melanjutkan ke objek perulangan berikutnya (seperti `continue` dalam pemrograman)

Defaultnya adalah "Keluar dari **alur kerja**", yang dapat diubah sesuai kebutuhan.

## Contoh

Misalnya, ketika sebuah pesanan dibuat, Anda perlu memeriksa stok untuk setiap produk dalam pesanan. Jika stok mencukupi, kurangi stok; jika tidak, perbarui produk dalam detail pesanan sebagai tidak valid.

1.  Buat tiga **koleksi**: Produk <-(1:m)-- Detail Pesanan --(m:1)-> Pesanan. Model datanya adalah sebagai berikut:

    **Koleksi Pesanan**
    | Nama Bidang       | Tipe Bidang             |
    | ----------------- | ----------------------- |
    | Detail Pesanan    | Satu-ke-Banyak (Detail Pesanan) |
    | Total Harga Pesanan | Angka                   |

    **Koleksi Detail Pesanan**
    | Nama Bidang | Tipe Bidang           |
    | ----------- | --------------------- |
    | Produk      | Banyak-ke-Satu (Produk) |
    | Kuantitas   | Angka                 |

    **Koleksi Produk**
    | Nama Bidang | Tipe Bidang     |
    | ----------- | --------------- |
    | Nama Produk | Teks Satu Baris |
    | Harga       | Angka           |
    | Stok        | Bilangan Bulat  |

2.  Buat sebuah **alur kerja**. Untuk pemicu, pilih "Event **Koleksi**", dan pilih **koleksi** "Pesanan" untuk memicu "Setelah data ditambahkan". Anda juga perlu mengonfigurasi untuk memuat data relasi **koleksi** "Detail Pesanan" dan **koleksi** Produk di bawah detail:

    ![Node Perulangan_Contoh_Konfigurasi Pemicu](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Buat node perulangan dan pilih objek perulangan sebagai "Data pemicu / Detail Pesanan", yang berarti akan memproses setiap catatan dalam **koleksi** Detail Pesanan:

    ![Node Perulangan_Contoh_Konfigurasi Node Perulangan](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Di dalam node perulangan, buat node "Kondisi" untuk memeriksa apakah stok produk mencukupi:

    ![Node Perulangan_Contoh_Konfigurasi Node Kondisi](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Jika mencukupi, buat "node Perhitungan" dan "node Perbarui data" di cabang "Ya" untuk memperbarui catatan produk yang sesuai dengan stok yang telah dikurangi setelah perhitungan:

    ![Node Perulangan_Contoh_Konfigurasi Node Perhitungan](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Node Perulangan_Contoh_Konfigurasi Node Perbarui Stok](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Jika tidak, di cabang "Tidak", buat "node Perbarui data" untuk memperbarui status detail pesanan menjadi "tidak valid":

    ![Node Perulangan_Contoh_Konfigurasi Node Perbarui Detail Pesanan](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Struktur **alur kerja** secara keseluruhan adalah sebagai berikut:

![Node Perulangan_Contoh_Struktur Alur Kerja](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Setelah mengonfigurasi dan mengaktifkan **alur kerja** ini, ketika pesanan baru dibuat, sistem akan secara otomatis memeriksa stok produk dalam detail pesanan. Jika stok mencukupi, stok akan dikurangi; jika tidak, produk dalam detail pesanan akan diperbarui menjadi tidak valid (agar total harga pesanan yang valid dapat dihitung).