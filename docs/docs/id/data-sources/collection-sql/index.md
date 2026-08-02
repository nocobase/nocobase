---
pkg: "@nocobase/plugin-collection-sql"
title: "Tabel SQL"
description: "Buat tabel data dari hasil kueri SQL, konfigurasikan sumber bidang, pemetaan bidang, dan pengenal unik rekaman, cocok untuk kueri relasi, statistik, dan penyajian laporan."
keywords: "Tabel SQL,SQL collection,Kueri SQL,Pemetaan bidang,Laporan,NocoBase"
---

#   Tabel SQL

##  Pengenalan

Menulis pernyataan kueri SQL untuk membentuk tabel SQL tidak akan membuat tabel database nyata di database. Fitur ini membaca hasil kueri agar hasil tersebut dapat digunakan dalam tabel, detail, diagram, dan alur kerja. Skenario yang sesuai: agregasi data dan laporan statistik.

:::warning Perhatian

Tabel SQL hanya mendukung pernyataan `SELECT` atau pernyataan `WITH ... SELECT`, serta hanya mendukung penayangan kueri data, bukan penambahan, pengeditan, atau penghapusan data.

:::

##  Membuat tabel SQL

1.  Klik menu sumber data di antara fungsi sistem untuk mengakses halaman beranda sumber data.
2.  Pilih sumber data **Main** dalam daftar sumber data, klik tindakan 「Configure」, lalu akses database utama.
3.  Dalam pengelolaan database utama, klik 「Create collection」 lalu pilih 「SQL collection」.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![create_sql_collection](https://static-docs.nocobase.com/create_sql_collection.png)
![create_sql_collection_configure](https://static-docs.nocobase.com/create_sql_collection_configure.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Collection display name | Nama yang ditampilkan tabel SQL di antarmuka, misalnya 「Ringkasan penjualan」 atau 「Peringatan stok」. Sebaiknya gunakan nama yang menjelaskan makna hasil kueri. |
| Collection name | Nama identitas tabel SQL di NocoBase, yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. Nama ini dibuat secara otomatis, tetapi juga dapat diubah secara manual; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Categories | Kategori tabel data. Hanya memengaruhi cara pengorganisasian antarmuka pengelolaan tabel data dan tidak mengubah kueri SQL. |
| Description | Deskripsi tabel data. Sebaiknya jelaskan data apa yang dikueri oleh SQL ini, siapa yang memeliharanya, dan halaman atau laporan mana yang menggunakannya. |
| Record unique key | Pengenal unik rekaman. Hasil kueri SQL tidak memiliki kunci utama nyata, sehingga perlu memilih bidang atau kombinasi bidang yang dapat mengidentifikasi rekaman secara unik; jika tidak, rekaman mungkin tidak dapat ditampilkan dengan benar dalam blok. |
| SQL | Pernyataan kueri yang digunakan tabel SQL. NocoBase akan menjalankan SQL ini, mengonfigurasi bidang berdasarkan hasil kueri, lalu menggunakan hasil kueri tersebut sebagai tabel data. |
| Source collections | Sumber bidang dalam hasil kueri SQL. Digunakan untuk mengaitkan bidang dalam hasil kueri dengan bidang pada tabel data yang sudah ada, sehingga membantu NocoBase mengenali sumber bidang dan tipe antarmukanya. |
| Fields | Konfigurasi pemetaan bidang. Digunakan untuk memastikan nama, sumber, tipe antarmuka, dan nama tampilan setiap bidang. |
| Preview | Pratinjau hasil kueri SQL. Sebelum mengirimkan, Anda dapat memastikan bahwa pemetaan bidang dan efek tampilan sudah sesuai harapan. |

###  Menulis pernyataan kueri SQL

Masukkan pernyataan kueri SQL, lalu klik 「Execute」 untuk menjalankan kueri dan mencoba mengurai bidang serta tabel data sumber yang dikembalikan.
Klik 「Execute」 hanya digunakan untuk menjalankan pratinjau dan mengurai bidang. Setelah memastikan pernyataan kueri SQL dapat digunakan, klik 「Confirm」 agar formulir dapat mengirimkan SQL ini sebagai pernyataan kueri yang telah dikonfirmasi.

![execute_sql_statement](https://static-docs.nocobase.com/202405191453556.png)

:::tip Tips

`Source collections` adalah tabel data sumber yang disimpulkan berdasarkan pernyataan kueri SQL. Sistem mengenali tabel data yang sudah ada yang menjadi sumber utama bidang dalam hasil kueri, lalu membatasi pilihan `Field source` yang tersedia saat pemetaan bidang.

Hasil inferensi ini digunakan untuk membantu konfigurasi secara cepat. Jika pernyataan kueri SQL berisi alias, subkueri, bidang hasil perhitungan, fungsi agregasi, atau join yang kompleks, hasilnya mungkin tidak sepenuhnya akurat atau tidak dapat disimpulkan. Anda dapat menentukan `Source collections` secara manual.

:::

###  Pemetaan bidang

Pemetaan bidang adalah konfigurasi yang wajib dikonfirmasi setelah tabel SQL dibuat. Hasil kueri SQL hanya memberi tahu NocoBase kolom apa saja yang dikembalikan. Agar kolom tersebut dapat digunakan seperti bidang biasa di antarmuka, Anda juga perlu mengonfirmasi `Field source` atau mengonfigurasi `Field interface` dan nama tampilan bidang.
[Pelajari lebih lanjut informasi konfigurasi bidang](../data-modeling/collection-fields/index.md)

![configure_sql_field_source](https://static-docs.nocobase.com/202405191453579.png)
![configure_sql_field_interface](https://static-docs.nocobase.com/202405191454703.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field source | Pilih tabel data dan bidang yang sudah ada sebagai sumber bidang hasil kueri SQL. Setelah sumber dipilih, NocoBase dapat menggunakan kembali Field interface dari bidang asal. |
| Field interface | Konfirmasikan cara bidang ditampilkan dan diinput pada halaman, misalnya teks satu baris, angka, tanggal, atau opsi tarik-turun. |
| Field display name | Nama yang ditampilkan bidang di antarmuka. Sebaiknya gunakan nama yang dapat dipahami oleh pengguna bisnis. |

Misalnya, kueri SQL mengembalikan `customers.name as customer_name` yang berasal dari bidang 「Nama pelanggan」 pada tabel pelanggan. Anda dapat memetakannya ke bidang yang sesuai pada tabel pelanggan. Dengan demikian, NocoBase dapat menggunakan kembali judul dan konfigurasi antarmuka bidang asal.

Jika bidang berasal dari hasil perhitungan, seperti `count(*) as total` atau `sum(amount) as amount_total`, biasanya tidak ada bidang sumber yang jelas, sehingga Anda perlu memilih Field interface yang sesuai secara manual.

:::tip Tips

`Field source` bergantung pada `Source collections`. Hanya setelah tabel data sumber dipilih, bidang sumber yang tersedia dari tabel tersebut akan muncul dalam tabel pemetaan bidang.

Jika inferensi bidang memiliki `Field source`, NocoBase akan memprioritaskan penggunaan kembali Field interface dari bidang sumber. Jika bidang sumber tidak dapat disimpulkan, Anda dapat menentukan `Field source` secara manual; jika hasil inferensi tidak sesuai dengan makna bisnis, hapus `Field source`, lalu tentukan `Field source` secara manual, atau pilih `Field interface` dan konfigurasikan `Field display name` secara manual.

:::

###  Pengenal unik rekaman

Tabel SQL perlu mengonfigurasi Record unique key; jika tidak, blok tidak dapat dibuat pada halaman dan rekaman tidak dapat ditampilkan dengan benar. Anda dapat memilih satu bidang atau kombinasi beberapa bidang sebagai pengenal unik. Bidang yang cocok digunakan sebagai Record unique key biasanya memenuhi kondisi berikut:

-  Setiap baris dalam hasil kueri bersifat unik
-  Nilai bidang stabil dan tidak berubah karena perubahan halaman, pengurutan, atau cakupan statistik
-  Bidang tidak boleh kosong
-  Bidang selalu dikembalikan dalam hasil kueri

Jika hasil kueri berasal dari satu tabel, sebaiknya kembalikan kunci utama tabel asal. Jika hasil kueri berasal dari join beberapa tabel atau agregasi, pertahankan ID bisnis yang stabil dalam SQL, atau kembalikan beberapa bidang yang secara bersama-sama dapat mengidentifikasi rekaman.

:::warning Perhatian

Jangan gunakan nilai seperti `row_number()` yang berubah mengikuti pengurutan, pemfilteran, atau cakupan statistik sebagai Record unique key yang stabil untuk jangka panjang. Setelah pengenal unik rekaman berubah, blok halaman, izin, alur kerja, dan API eksternal mungkin tidak dapat menemukan rekaman yang sama.

:::

###  Pratinjau hasil kueri

Sebelum mengirimkan, gunakan Preview untuk melihat hasil kueri SQL. Saat melakukan pratinjau, periksa terutama:

-  Apakah SQL dapat dijalankan dengan normal
-  Apakah bidang yang dikembalikan sudah lengkap
-  Apakah Field interface dan nama tampilan sesuai dengan makna bisnis
-  Apakah Record unique key ada dan datanya unik
-  Apakah hasil kueri sesuai untuk ditampilkan pada halaman

![preview_sql_collection](https://static-docs.nocobase.com/202405191455439.png)

##  Mengonfigurasi bidang

Setelah tabel SQL dibuat, klik 「Configure fields」 di sebelah kanan tabel SQL dalam daftar tabel data untuk masuk ke halaman konfigurasi bidang. Konfigurasi bidang digunakan untuk memelihara bidang yang dimiliki tabel SQL, cara bidang ditampilkan di antarmuka, serta cara hasil kueri SQL dipetakan menjadi Field interface NocoBase.
[Pelajari lebih lanjut informasi konfigurasi bidang](../data-modeling/collection-fields/index.md)

###  Mengganti tipe UI

Setelah tabel SQL dibuat, Anda tetap dapat menyesuaikan konfigurasi antarmuka bidang di konfigurasi bidang. Halaman konfigurasi bidang terutama digunakan untuk mengganti Field interface, mengubah nama tampilan, deskripsi, dan konfigurasi khusus bidang.
![configure_field_sql](https://static-docs.nocobase.com/configure_field_sql.png)

Hal-hal berikut dapat ditangani di sini:

-  Saat membuat tabel SQL, Field interface yang ditetapkan tidak benar
-  Nama tampilan bidang tidak sesuai dengan kebiasaan bisnis dan perlu diubah menjadi nama yang lebih mudah dipahami
-  Makna bisnis bidang hasil kueri berubah dan cara penampilannya perlu dikonfirmasi ulang
-  Deskripsi bidang atau konfigurasi khusus bidang perlu disesuaikan, misalnya opsi tarik-turun

###  Sinkronisasi dari database

Jika pernyataan kueri SQL tidak berubah, tetapi struktur tabel data atau bidang dasar berubah, buka 「Configure fields」 lalu klik 「Sync from database」 untuk menjalankan ulang SQL dan menyinkronkan bidang. Untuk pemetaan bidang, lihat [「Membuat tabel SQL」](#字段映射).

![sync_sql_collection_fields](https://static-docs.nocobase.com/202405191456216.png)

###  Mengedit bidang

Klik 「Edit」 di sebelah kanan bidang untuk mengedit konfigurasi bidang. Pengeditan bidang sesuai untuk menyesuaikan cara bidang ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, aturan validasi, atau konfigurasi khusus bidang.
[Pelajari lebih lanjut informasi konfigurasi bidang](../data-modeling/collection-fields/index.md)

:::warning Perhatian

Mengedit konfigurasi bidang tidak akan mengubah pernyataan kueri SQL, nama bidang pada tabel sumber, definisi bidang pada tabel sumber, atau indeks database. Jika perlu menyesuaikan kolom nyata dalam hasil kueri, ubah pernyataan kueri SQL terlebih dahulu, lalu jalankan ulang dan sinkronkan bidang.

:::

###  Menghapus bidang

Klik 「Delete」 di sebelah kanan bidang untuk menghapus satu bidang. Menghapus bidang hanya menghapus bidang yang tersimpan di NocoBase, bukan pernyataan kueri SQL atau kolom nyata dalam tabel data sumber.
[Pelajari lebih lanjut informasi konfigurasi bidang](../data-modeling/collection-fields/index.md)

:::warning Perhatian

Penghapusan bidang dapat memengaruhi blok halaman, kondisi pemfilteran, pengurutan, izin, alur kerja, API, dan konfigurasi yang sudah ada. Sebelum menghapus, pastikan bidang tersebut tidak lagi digunakan. Jika pernyataan kueri SQL masih mengembalikan kolom ini, NocoBase mungkin akan mengenali bidang tersebut kembali saat 「Sync from database」 dijalankan.

:::

##  Mengedit tabel SQL

Dalam daftar tabel data, klik 「Edit」 di sebelah kanan tabel SQL untuk menyesuaikan metadata dan konfigurasi operasional tabel SQL di NocoBase. Item konfigurasi saat mengedit pada dasarnya sama dengan saat membuat tabel SQL, hanya `Collection name` yang tidak dapat diubah.

Jika pernyataan kueri SQL berubah, klik 「Execute」 lagi dan konfirmasikan pemetaan bidang, Record unique key, serta hasil pratinjau.

![edit_sql_collection](https://static-docs.nocobase.com/202405191455302.png)

:::warning Perhatian

Perubahan pada pernyataan kueri SQL dapat menyebabkan perubahan nama bidang, pemetaan bidang, atau Record unique key. Setelah melakukan perubahan, periksa kembali apakah blok halaman, diagram, izin, dan alur kerja masih dapat digunakan.

:::

##  Menghapus tabel SQL

Dalam daftar tabel data, klik 「Delete」 di sebelah kanan tabel SQL. Tindakan ini hanya menghapus konfigurasi dan bidang tabel SQL di NocoBase, bukan tabel sumber dasar atau data di dalam tabel sumber.
Anda juga dapat memilih beberapa tabel untuk menghapusnya secara bersamaan. Sebelum menghapus, periksa apakah blok halaman, diagram, izin, alur kerja, dan API eksternal masih menggunakan tabel SQL ini.