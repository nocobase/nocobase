---
pkg: "@nocobase/plugin-data-source-main"
title: "Tabel Umum"
description: "Tabel umum cocok untuk menyimpan data bisnis rutin seperti pelanggan, pesanan, kontrak, tiket kerja, proyek, dan tugas, serta mendukung field sistem umum, konfigurasi primary key, dan penyusunan blok halaman."
keywords: "Tabel Umum,General Collection,field sistem,tabel data,NocoBase"
---

# Tabel Umum

## Pengenalan

Tabel umum adalah jenis tabel data yang paling sering digunakan dan cocok untuk menyimpan data bisnis rutin seperti pelanggan, pesanan, kontrak, tiket kerja, formulir penggantian biaya, proyek, dan tugas. Jika sebagian besar objek bisnis tidak memiliki persyaratan struktur khusus, tabel umum sudah cukup untuk digunakan secara default.

Tabel umum dapat berasal dari sumber data berikut:

- Tabel baru yang dibuat di database utama
- Tabel nyata yang sudah ada dan disinkronkan dari database utama
- Tabel nyata yang sudah ada dari database eksternal
- Sumber daya yang dipetakan melalui REST API
- Tabel data dari aplikasi NocoBase eksternal

Di NocoBase, semua data ini digunakan sebagai tabel umum. Perbedaannya adalah: tabel umum di database utama dapat dibuat dan dikelola struktur tabel nyatanya oleh NocoBase; sedangkan tabel umum dari sumber data eksternal biasanya hanya membaca struktur yang sudah ada, dan struktur tabel nyata tetap dikelola oleh sistem eksternal.

## Skenario penggunaan

Tabel umum cocok untuk skenario bisnis berikut:

- Data CRM seperti pelanggan, kontak, peluang, dan kontrak
- Data transaksi seperti pesanan, surat jalan, retur, dan faktur
- Data kolaborasi seperti tiket kerja, tugas, proyek, dan kebutuhan
- Data proses seperti formulir penggantian biaya, pesanan pembelian, dan permohonan pembayaran
- Data dasar seperti perangkat, aset, produk, dan toko



## Pembuatan dan konfigurasi

Di database utama, klik «Create collection», lalu pilih «General collection» untuk membuat tabel umum.

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| Konfigurasi | Penjelasan |
| --- | --- |
| Collection display name | Nama tabel yang ditampilkan di antarmuka, misalnya «Pelanggan», «Pesanan», atau «Lampiran kontrak». Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Collection name | Nama identitas tabel yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Nama ini dibuat secara otomatis, tetapi juga dapat diubah secara manual; hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Categories | Kategori tabel data. Kategori hanya memengaruhi cara tabel data diatur dalam antarmuka pengelolaan, dan tidak mengubah struktur tabel data. Jika tabel data cukup banyak, sebaiknya kelompokkan berdasarkan modul bisnis, misalnya «Manajemen pelanggan», «Manajemen proyek», dan «Keuangan». |
| Description | Keterangan tabel data. Anda dapat menuliskan data apa yang disimpan, siapa yang mengelolanya, dan proses bisnis apa yang terkait untuk memudahkan pemeliharaan selanjutnya. |
| Use simple pagination mode | Mode pagination sederhana. Setelah diaktifkan, pagination pada blok tabel akan melewati penghitungan jumlah total record. Mode ini cocok untuk tabel dengan volume data sangat besar dan dapat mengurangi beban kueri. |
| Preset fields | Field prasetel. Saat membuat tabel, Anda dapat memilih apakah akan menambahkan field umum secara otomatis, seperti ID, waktu dibuat, pembuat, waktu diperbarui, dan pengubah. Untuk tabel bisnis umum, sebaiknya field-field ini tetap dipertahankan. |

### Field bawaan

Saat membuat tabel umum, Anda dapat menggunakan `Preset fields` untuk menambahkan field sistem umum secara otomatis.

| Field | Nama field | Penjelasan |
| --- | --- | --- |
| ID | `id` | Field primary key default yang digunakan untuk mengidentifikasi satu record secara unik. Tipe primary key default adalah `Snowflake ID (53-bit)`. |
| Waktu dibuat | `createdAt` | Mencatat waktu pembuatan record secara otomatis. Umumnya digunakan untuk pengurutan, pemfilteran, audit, dan kondisi workflow. |
| Pembuat | `createdBy` | Mencatat pengguna yang membuat record secara otomatis. Umumnya digunakan untuk «hanya melihat data yang saya buat», kontrol izin, dan pelacakan tanggung jawab. |
| Waktu diperbarui | `updatedAt` | Mencatat waktu pembaruan terakhir record secara otomatis. Umumnya digunakan untuk menentukan apakah data telah diubah. |
| Pengubah | `updatedBy` | Mencatat pengguna yang terakhir memperbarui record secara otomatis. Umumnya digunakan dalam skenario audit dan kolaborasi. |
| [Ruang](../../multi-app/multi-space/index.md) | `space` | Tersedia setelah [plugin multi-ruang](../../multi-app/multi-space/index.md) diaktifkan, dan digunakan untuk mengisolasi data berdasarkan ruang. Jika multi-ruang tidak diaktifkan, field ini tidak akan muncul dalam field prasetel tabel umum. |

### Field primary key

**Primary key** menandai field primary key. Field ini digunakan untuk mengidentifikasi satu record secara unik pada tingkat database. Saat membuat tabel, sebaiknya pertahankan field prasetel ID; tipe primary key default adalah `Snowflake ID (53-bit)`.

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Arahkan kursor ke Interface pada field ID untuk memilih tipe primary key lainnya.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Tipe primary key yang tersedia:

- [Teks](../data-modeling/collection-fields/basic/input.md)
- [Bilangan bulat](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning Perhatian

Tabel data tanpa primary key harus menetapkan «Record unique key» saat mengedit tabel data. Jika tidak, blok tidak dapat dibuat di halaman dan record tidak dapat dilihat atau diedit dengan benar.

:::


## Penggunaan dalam konfigurasi halaman

Tabel umum dapat digunakan untuk sebagian besar blok data dan blok pemfilteran.

| Blok | Kegunaan |
| --- | --- |
| [Blok tabel](../../interface-builder/blocks/data-blocks/table.md) | Melihat, memfilter, mengurutkan, dan memproses record secara massal. |
| [Blok formulir](../../interface-builder/blocks/data-blocks/form.md) | Menambahkan atau mengedit satu record. |
| [Blok detail](../../interface-builder/blocks/data-blocks/details.md) | Melihat detail satu record. |
| [Blok daftar](../../interface-builder/blocks/data-blocks/list.md) | Menampilkan record dalam bentuk daftar. |
| [Blok kartu grid](../../interface-builder/blocks/data-blocks/grid-card.md) | Menampilkan record seperti gambar, file, produk, dan aset dalam bentuk grid kartu. |
| [Blok kanban](../../interface-builder/blocks/data-blocks/kanban.md) | Menampilkan record secara berkelompok berdasarkan field seperti status, tahap, dan penanggung jawab. |
| [Blok kalender](../../interface-builder/blocks/data-blocks/calendar.md) | Menampilkan record berdasarkan tanggal atau rentang waktu. |
| [Blok grafik](../../interface-builder/blocks/data-blocks/chart.md) | Membuat grafik statistik berdasarkan record. |
| [Blok peta](../../interface-builder/blocks/data-blocks/map.md) | Menampilkan record berdasarkan lokasi geografis. |
| [Blok Gantt](../../plugins/@nocobase/plugin-gantt/index.md) | Menampilkan rencana proyek dan jadwal tugas berdasarkan waktu mulai dan selesai. |
| [Blok filter formulir](../../interface-builder/blocks/filter-blocks/form.md) | Memfilter blok data pada halaman menggunakan kondisi formulir. |
| [Blok filter pohon](../../interface-builder/blocks/filter-blocks/tree.md) | Memfilter blok data pada halaman menggunakan struktur pohon, yang umumnya digunakan untuk pemfilteran hierarkis berdasarkan kategori, organisasi, wilayah, dan sebagainya. |

## Mengedit konfigurasi

Dalam daftar tabel data, klik «Edit» di sebelah kanan tabel umum untuk mengubah konfigurasi dasar tabel data. Pengeditan tabel data terutama digunakan untuk menyesuaikan metadata tabel data dan sebagian konfigurasi runtime, bukan untuk mengubah struktur field secara massal.

Jika ingin menambahkan field, mengubah tipe field, menyesuaikan tipe antarmuka field, atau menghapus field, buka «Configure fields».

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| Konfigurasi | Dapat diedit | Penjelasan |
| --- | --- | --- |
| Collection display name | Ya | Nama tabel yang ditampilkan di antarmuka, misalnya «Pelanggan», «Pesanan», atau «Lampiran kontrak». Setelah diubah, hanya tampilan di antarmuka yang terpengaruh, bukan nama identitas tabel. |
| Collection name | Tidak | Nama identitas tabel yang digunakan untuk referensi internal seperti API, field relasi, izin, dan workflow. Setelah dibuat, nama ini tidak dapat diubah dalam formulir pengeditan. |
| Inherits | Mendukung dengan syarat | Memilih tabel induk yang akan diwarisi. Hanya tersedia jika database utama adalah PostgreSQL dan konfigurasi ini ditampilkan di antarmuka. Sebelum menyesuaikan relasi pewarisan tabel data yang sudah ada, pastikan struktur field, blok halaman, izin, dan workflow tidak bergantung pada struktur sebelumnya. |
| Categories | Ya | Kategori tabel data. Kategori hanya memengaruhi cara tabel data diatur dalam antarmuka pengelolaan, dan tidak mengubah struktur tabel data. |
| Description | Ya | Keterangan tabel data. Cocok digunakan untuk melengkapi informasi tentang tujuan tabel, pengelola, sumber data, dan proses bisnis terkait. |
| Use simple pagination mode | Ya | Mode pagination sederhana. Setelah diaktifkan, pagination pada blok tabel akan melewati penghitungan jumlah total record. Mode ini cocok untuk tabel dengan volume data sangat besar. |
| Record unique key | Ya | Identitas unik record. Digunakan untuk menemukan satu record dalam blok, biasanya dengan memilih primary key atau field unik. Tabel data tanpa primary key wajib mengonfigurasi opsi ini; jika tidak, blok tidak dapat dibuat dengan benar dan record tidak dapat dilihat atau diedit. |

:::warning Perhatian

Mengedit tabel data tidak akan menyesuaikan field yang sudah ada secara otomatis. `Preset fields` hanya berlaku saat tabel dibuat; jika setelah pembuatan Anda masih perlu menambahkan field seperti waktu dibuat, pembuat, waktu diperbarui, dan pengubah, tambahkan field tersebut secara terpisah melalui «Configure fields».

:::

## Menghapus tabel data

Dalam daftar tabel data, klik «Delete» di sebelah kanan tabel umum untuk menghapus tabel data. Tabel umum di database utama juga mendukung penghapusan secara bersamaan setelah dipilih secara massal.

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

Konfirmasi kedua akan muncul saat penghapusan. Setelah dikonfirmasi, NocoBase akan menghapus metadata Collection tabel umum ini serta tabel data nyata dan datanya di database utama.

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

Pada dialog konfirmasi penghapusan terdapat opsi yang dapat dipilih: menghapus objek yang bergantung pada tabel data ini secara otomatis. Setelah diaktifkan, NocoBase akan mencoba menghapus sekaligus objek database yang bergantung pada tabel ini, seperti view database yang dibuat berdasarkan tabel ini, serta objek lain yang masih bergantung pada objek-objek tersebut.

:::danger Peringatan

Menghapus tabel umum adalah tindakan berisiko tinggi. Setelah dihapus, struktur tabel, data tabel, metadata field, serta blok halaman, field relasi, izin, workflow, dan pemanggilan API yang bergantung pada tabel ini mungkin tidak lagi berfungsi. Sebelum mencentang opsi penghapusan otomatis objek dependen, pastikan objek-objek tersebut juga boleh dihapus.

:::
