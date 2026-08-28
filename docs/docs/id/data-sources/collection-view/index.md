---
pkg: "@nocobase/plugin-data-source-main"
title: "View Database"
description: "Menghubungkan view yang sudah ada di database sebagai sumber data, lalu mengonfigurasi field dan tampilannya di NocoBase, cocok untuk pengelolaan visual hasil kueri kompleks."
keywords: "View Database,Collection View,View"
---
# Menghubungkan view database

## Pendahuluan

Menghubungkan view yang ada di database, seperti view laporan keuangan yang dikelola DBA, view pelanggan yang telah difilter, atau view agregasi hasil sinkronisasi lintas sistem. Fitur ini cocok untuk menggunakan kembali logika kueri yang telah didefinisikan di database.

:::tip Catatan

Mendukung view biasa dalam cakupan pemilik akun koneksi database utama, tetapi tidak mendukung materialized view. Meskipun akun tersebut memiliki izin kueri ke view milik pemilik lain, view tersebut tidak akan muncul dalam daftar yang dapat dihubungkan. Sebelum menghubungkan, pastikan field view memiliki nama kolom yang stabil dan tipe field yang dapat dikenali oleh NocoBase.

:::

## Menghubungkan view database

1. Klik menu sumber data di fungsi sistem untuk mengakses beranda sumber data.
2. Pilih sumber data **Main** dalam daftar sumber data, lalu klik tindakan 「Configure」 untuk mengakses database utama.
3. Di pengelolaan database utama, klik 「Create collection」, lalu pilih 「Connect to database view」

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)
![connect_view](https://static-docs.nocobase.com/connect_view.png)
![connect_view_configure](https://static-docs.nocobase.com/connect_view_configure.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Collection display name | Nama yang ditampilkan untuk view database di antarmuka, misalnya 「View laporan keuangan」 atau 「View statistik pelanggan」. Sebaiknya gunakan nama yang menjelaskan tujuan view. |
| Collection name | Nama identifikasi view database di NocoBase, yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Nama ini dibuat secara otomatis, tetapi juga dapat diubah secara manual; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Database view | Pilih view database yang ingin dihubungkan. Struktur field dan hasil kueri akan dibaca dari view. Saat mengedit, view yang sedang terhubung dapat dilihat, tetapi tidak dapat diganti ke view lain. |
| Categories | Kategori tabel data. Hanya memengaruhi pengorganisasian antarmuka pengelolaan tabel data dan tidak mengubah view database itu sendiri. |
| Description | Deskripsi tabel data. Sebaiknya jelaskan siapa yang memelihara view ini, data apa yang dikueri, serta halaman atau laporan apa yang menggunakannya. |
| Use simple pagination mode | Mode pagination sederhana. Setelah diaktifkan, pagination pada blok tabel akan melewati penghitungan jumlah total record. Mode ini cocok untuk view dengan volume data besar dan dapat mengurangi beban kueri. |
| Record unique key | Identifikasi unik record. View database biasanya tidak memiliki primary key, sehingga perlu memilih field yang dapat mengidentifikasi record secara unik; jika tidak, record mungkin tidak dapat dilihat atau diedit dengan benar di dalam blok. |
| Source collections | Sumber field view database. Digunakan untuk menghubungkan field view dengan field tabel data yang sudah ada, sehingga membantu NocoBase mengenali tipe field dan tipe antarmuka. |
| Fields | Konfigurasi pemetaan field. Digunakan untuk mengonfirmasi nama, judul, tipe data, dan tipe antarmuka setiap field dalam view. |
| Preview | Pratinjau hasil view database. Sebelum mengirimkan konfigurasi, Anda dapat memastikan bahwa pemetaan field dan tampilan sudah sesuai harapan. |
| Allow add new, update and delete actions | Menentukan apakah operasi penambahan, pembaruan, dan penghapusan diizinkan pada view database. Setelah diaktifkan, NocoBase akan menyediakan titik masuk untuk operasi terkait di halaman; keberhasilan penulisan tetap bergantung pada apakah view database dapat ditulis dan apakah akun database memiliki izin insert, update, dan delete. |

:::tip Catatan

`Source collections` adalah tabel data sumber yang disimpulkan berdasarkan view database, untuk mengidentifikasi tabel data yang sudah ada yang menjadi sumber utama field dalam view, serta membatasi pilihan `Field source` saat pemetaan field.

Hasil inferensi digunakan untuk membantu konfigurasi dengan cepat. Jika view memiliki penggantian nama field, perhitungan, agregasi, atau join yang kompleks, hasilnya mungkin tidak sepenuhnya akurat atau tidak dapat disimpulkan, sehingga perlu dikonfirmasi secara manual di `Fields`.

:::

### Pemetaan field

Pemetaan field adalah konfigurasi yang wajib dikonfirmasi setelah menghubungkan view database. Setelah view terhubung, NocoBase akan terlebih dahulu menyimpulkan sumber dan tipe database setiap field view: jika field sumber berhasil disimpulkan, Field type, Field interface, dan Field display name dari field yang sudah ada akan diisi secara otomatis; jika tidak dapat disimpulkan, Field type awal akan diberikan berdasarkan tipe field database, dan tipe field serta konfigurasi antarmuka perlu dikonfirmasi secara manual.
[Pelajari lebih lanjut tentang konfigurasi field](../data-modeling/collection-fields/index.md)

![connect_view_configure_field_source](https://static-docs.nocobase.com/connect_view_configure_field_source.png)
![connect_view_configure_field_interface](https://static-docs.nocobase.com/connect_view_configure_field_interface.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field source | Pilih tabel data dan field yang sudah ada sebagai sumber field view. Setelah sumber dipilih, NocoBase dapat menggunakan kembali Field type dan Field interface dari field asli. |
| Field type | Jika field view tidak memiliki sumber yang jelas, konfirmasikan tipe data field secara manual. |
| Field interface | Konfirmasikan cara field ditampilkan dan diinput pada halaman, misalnya teks satu baris, angka, tanggal, atau opsi dropdown. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka. Sebaiknya gunakan nama yang dapat dipahami oleh pengguna bisnis. |

Misalnya, jika view mengembalikan `customer_name` dan field tersebut berasal dari field 「Nama pelanggan」 pada tabel pelanggan, Anda dapat memetakannya ke field terkait pada tabel pelanggan. Dengan demikian, NocoBase dapat menggunakan kembali judul, tipe, dan konfigurasi antarmuka field asli.

Jika field view berasal dari hasil agregasi atau perhitungan, seperti `count(*) as total` dan `sum(amount) as amount_total`, biasanya Anda perlu memilih Field type dan Field interface yang sesuai secara manual.

:::tip Catatan

`Field source` berasal dari inferensi NocoBase terhadap view database dan menunjukkan field yang sudah ada yang kemungkinan sesuai dengan field tertentu pada view. Jika field memiliki `Field source`, NocoBase akan memprioritaskan penggunaan kembali Field type dan Field interface dari field sumber.

Jika field sumber tidak dapat disimpulkan atau hasil inferensinya tidak sesuai dengan makna bisnis, hapus `Field source`, lalu pilih `Field type`, `Field interface`, dan `Field display name` secara manual.

:::

### Identifikasi unik record

View database perlu dikonfigurasi dengan Record unique key; jika tidak, blok tidak dapat dibuat pada halaman dan record tidak dapat dilihat atau diedit dengan benar. Anda dapat memilih satu field atau kombinasi beberapa field sebagai identifikasi unik. Field yang sesuai digunakan sebagai Record unique key biasanya memenuhi kondisi berikut:

- Nilai field unik
- Nilai field stabil dan tidak berubah karena perubahan pengurutan, pagination, atau cakupan statistik
- Field tidak boleh kosong
- Field selalu dikembalikan dalam view

Jika view berasal dari kueri satu tabel, sebaiknya kembalikan primary key tabel asli. Jika view berasal dari join atau agregasi beberapa tabel, pertahankan ID bisnis yang stabil dalam view database, atau buat field unik yang stabil dari sisi database.

### Mengizinkan operasi penambahan, pembaruan, dan penghapusan

Jika view database mendukung penulisan, Anda dapat mengaktifkan 「Allow add new, update and delete actions」. NocoBase akan mengizinkan operasi penambahan, pembaruan, dan penghapusan pada view ini di halaman.

View database lebih cocok digunakan sebagai hasil kueri dan secara default diperlakukan sebagai tabel data hanya-baca. Aktifkan opsi ini hanya setelah memastikan bahwa view database mendukung operasi penulisan terkait dan izin database juga mengizinkan penulisan.

### Pratinjau hasil view

Sebelum mengirimkan konfigurasi, gunakan Preview untuk melihat hasil kueri view. Saat melakukan pratinjau, periksa hal-hal berikut:

- Apakah view dapat dikueri secara normal
- Apakah semua field tersedia
- Apakah tipe field dan tipe antarmuka sesuai dengan makna bisnis
- Apakah Record unique key tersedia dan nilainya unik
- Apakah tipe field yang tidak didukung perlu disesuaikan dari sisi database

![connect_view_configure_preview](https://static-docs.nocobase.com/connect_view_configure_preview.png)

## Konfigurasi field

Setelah view database dibuat, klik 「Configure fields」 di sisi kanan view dalam daftar tabel data untuk masuk ke halaman konfigurasi field. Konfigurasi field digunakan untuk mengelola field yang tersedia pada view, cara field ditampilkan di antarmuka, serta cara field view database dipetakan ke Field type dan Field interface NocoBase.

Field biasa pada view database berasal dari view database. NocoBase tidak akan menambahkan, mengubah, atau menghapus kolom nyata secara langsung di dalam view. Pada halaman konfigurasi field, hanya field relasi many-to-one yang dapat ditambahkan untuk melengkapi hubungan bisnis di NocoBase. View database tidak dapat digunakan sebagai tabel data target untuk field relasi, dan field judul biasanya tidak perlu dikonfigurasi.

[Pelajari lebih lanjut tentang konfigurasi field](../data-modeling/collection-fields/index.md)

![configure_view](https://static-docs.nocobase.com/configure_view.png)

### Menambahkan field relasi

View database hanya dapat menambahkan field relasi many-to-one. Field relasi many-to-one dapat memetakan field yang sudah ada dalam view ke primary key atau field unik pada tabel data target, sehingga record terkait dapat ditampilkan di halaman, tetapi tidak akan membuat field nyata atau batasan foreign key di dalam view database.

Klik 「Add field」 untuk menambahkan field relasi many-to-one.

[Pelajari lebih lanjut tentang konfigurasi field](../data-modeling/collection-fields/index.md)

![add_view_field](https://static-docs.nocobase.com/add_view_field.png)
![add_view_field_configure](https://static-docs.nocobase.com/add_view_field_configure.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field display name | Nama yang ditampilkan untuk field relasi many-to-one di antarmuka. Sebaiknya gunakan nama yang dapat dipahami pengguna bisnis, misalnya 「Pelanggan terkait」 atau 「Pesanan terkait」. |
| Field name | Nama identifikasi field relasi many-to-one yang disimpan di NocoBase, digunakan untuk referensi internal seperti API, izin, dan workflow. |
| Source collection | Tabel data sumber, yaitu tabel data view database saat ini. Digunakan untuk menentukan `Foreign key` dari field tabel data mana yang akan dipilih; saat menambahkan field relasi many-to-one pada view database, biasanya tetap gunakan view saat ini. |
| Target collection | Tabel data target yang akan dihubungkan. Biasanya pilih tabel data nyata seperti tabel data biasa atau tabel database eksternal, bukan view database. |
| Foreign key | Field dalam view database saat ini yang digunakan untuk menyimpan identifikasi record target. Field ini harus dikembalikan secara stabil dalam hasil kueri view. |
| Target key | Field pada tabel data target yang akan dicocokkan dengan `Foreign key`, biasanya primary key atau field unik. |
| Description | Deskripsi field. Dapat digunakan untuk menjelaskan makna hubungan, sumber data, cara pemeliharaan, atau hal-hal yang perlu diperhatikan. |

### Pemetaan field

Setelah view database terhubung, NocoBase akan menyimpulkan Field type berdasarkan field view dan field sumber, lalu mencocokkannya dengan Field interface default. Jika sumber field, cara tampilan, atau makna bisnis tidak sesuai harapan, pemetaan dapat disesuaikan dalam konfigurasi field.

[Pelajari lebih lanjut tentang konfigurasi field](../data-modeling/collection-fields/index.md)

![edit_view_field_configure](https://static-docs.nocobase.com/edit_view_field_configure.png)

:::tip Catatan

- Field interface（tipe antarmuka / tipe UI）: menentukan cara field ditampilkan dan berinteraksi di frontend. Misalnya 「teks satu baris」, 「angka」, 「menu dropdown」, atau 「tanggal dan waktu」. Ini merupakan klasifikasi field dari sudut pandang pengguna.
- Field type（tipe data）: menentukan cara NocoBase mengenali tipe data field. Field view yang tidak memiliki field sumber biasanya disimpulkan dari tipe field database, misalnya `string`, `integer`, `decimal`, `boolean`, `datetime`, dan sebagainya.

:::

:::warning Perhatian

Mengubah Field source, Field type, atau Field interface tidak sama dengan mengubah tipe field pada view database. Pengaturan ini terutama memengaruhi cara tampilan halaman, aturan validasi, serta cara NocoBase mengenali field.

:::

### Sinkronisasi dari database

Jika struktur field view di sisi database diubah, buka 「Configure fields」, lalu klik 「Sync from database」 untuk membaca ulang struktur field. Setelah sinkronisasi, NocoBase akan memperbarui field: menambahkan field baru yang muncul dalam view, membersihkan field yang telah dihapus dari view, serta mengonfirmasi kembali tipe dan sumber field.

![edit_view_sync_from_database](https://static-docs.nocobase.com/edit_view_sync_from_database.png)
![edit_view_sync_from_database_configure](https://static-docs.nocobase.com/edit_view_sync_from_database_configure.png)

:::warning Perhatian

Saat sinkronisasi, penggantian nama field biasanya akan terlihat sebagai “menghapus field lama + menambahkan field baru”. Sebelum sinkronisasi, pastikan field lama tidak lagi digunakan oleh halaman, izin, workflow, atau API eksternal untuk mencegah konfigurasi menjadi tidak valid. Setelah sinkronisasi, periksa kembali Field type dan Field interface.

:::

### Mengedit field

Klik 「Edit」 di sisi kanan field untuk mengedit konfigurasi field. Pengeditan field cocok untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, aturan validasi, atau konfigurasi khusus field.
[Pelajari lebih lanjut tentang konfigurasi field](../data-modeling/collection-fields/index.md)

![edit_field](https://static-docs.nocobase.com/edit_field.png)
![edit_field_configure](https://static-docs.nocobase.com/edit_field_configure.png)

:::warning Perhatian

Mengedit konfigurasi field tidak akan mengubah nama kolom nyata, tipe field, ekspresi SQL, atau indeks dalam view database. Jika struktur nyata view perlu disesuaikan, ubah view terlebih dahulu dari sisi database, lalu gunakan 「Sync from database」 untuk menyinkronkannya.

:::

### Menghapus field

Klik 「Delete」 di sisi kanan field untuk menghapus satu field. Penghapusan field hanya menghapus field yang disimpan di NocoBase dan tidak menghapus kolom nyata dalam view database.

[Pelajari lebih lanjut tentang konfigurasi field](../data-modeling/collection-fields/index.md)

![delete_field](https://static-docs.nocobase.com/delete_field.png)

:::warning Perhatian

Penghapusan field dapat memengaruhi blok halaman, kondisi filter, pengurutan, izin, workflow, API, dan konfigurasi yang sudah ada. Sebelum menghapus, pastikan field tersebut masih digunakan atau tidak. Jika view database masih mengembalikan kolom ini, NocoBase mungkin akan mengenali field tersebut kembali saat 「Sync from database」 dijalankan berikutnya.

:::

## Mengedit view

Definisi SQL view database dikelola dari sisi database. Dalam daftar tabel data, klik 「Edit」 di sisi kanan view database untuk menyesuaikan metadata dan konfigurasi runtime view database di NocoBase; tindakan ini tidak mengubah view di database. Jika perlu menghubungkan view database lain, sebaiknya buat tabel data view database baru.

![edit_view](https://static-docs.nocobase.com/edit_view.png)
![edit_view_configure](https://static-docs.nocobase.com/edit_view_configure.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Collection display name | Nama yang ditampilkan untuk view database di antarmuka. Nama ini dapat diubah menjadi nama yang mudah dipahami pengguna bisnis, misalnya 「View laporan keuangan」 atau 「View statistik pelanggan」. |
| Collection name | Nama identifikasi view database di NocoBase. Tidak dapat diubah saat mengedit. |
| Database view | View database yang sedang terhubung. Bersifat hanya-baca saat mengedit dan tidak dapat diganti ke view lain. |
| Categories | Kategori tabel data. Hanya memengaruhi pengorganisasian antarmuka pengelolaan sumber data dan tidak mengubah view database. |
| Description | Deskripsi tabel data. Cocok untuk menjelaskan pemelihara view, sumber kueri, serta halaman atau laporan yang menggunakannya. |
| Use simple pagination mode | Mode pagination sederhana. Setelah diaktifkan, pagination pada blok tabel akan melewati penghitungan jumlah total record dan cocok untuk view dengan volume data besar. |
| Record unique key | Identifikasi unik record. Digunakan untuk menemukan satu record, biasanya berupa field atau kombinasi field yang stabil dan unik dalam view. |
| Allow add new, update and delete actions | Menentukan apakah operasi penambahan, pembaruan, dan penghapusan diizinkan. Sebaiknya diaktifkan hanya jika view database mendukung penulisan dan akun database memiliki izin terkait. |

:::warning Perhatian

Setelah mengubah Record unique key atau Allow add new, update and delete actions, periksa kembali apakah blok halaman, izin, dan workflow masih sesuai harapan.

:::

## Menghapus view

Dalam daftar tabel data, klik 「Delete」 di sisi kanan view database untuk menghapus tabel data view database. Penghapusan tabel data view database hanya menghapus konfigurasi koneksi dan field di NocoBase, bukan view di database.

View database dalam database utama juga dapat dipilih secara massal lalu dihapus sekaligus. Sebelum menghapus, periksa apakah blok halaman, diagram, izin, workflow, dan API eksternal masih menggunakan tabel data view database ini.
![delete_view](https://static-docs.nocobase.com/delete_view.png)
![delete_view_second_confirmation](https://static-docs.nocobase.com/delete_view_second_confirmation.png)
