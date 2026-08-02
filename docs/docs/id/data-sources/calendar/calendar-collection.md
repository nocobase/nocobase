---
pkg: "@nocobase/plugin-calendar"
title: "Tabel kalender"
description: "Tabel kalender digunakan untuk menyimpan data dengan rentang waktu seperti rapat, jadwal, kursus, dan piket, serta menampilkan dan mengedit catatan acara melalui blok kalender."
keywords: "Tabel kalender,Calendar Collection,acara kalender,acara berulang,blok kalender,NocoBase"
---

# Tabel kalender

## Pengenalan

Tabel kalender cocok untuk menyimpan data dengan rentang waktu, seperti reservasi ruang rapat, jadwal proyek, jadwal kursus, rencana piket, dan agenda kegiatan. Pada dasarnya, tabel ini tetap merupakan tabel data, tetapi sudah dilengkapi dengan bidang yang berkaitan dengan acara kalender agar dapat digunakan bersama blok kalender.

Tabel kalender hanya dapat dibuat melalui halaman basis data utama. Basis data eksternal, sumber data REST API, dan sumber data NocoBase eksternal tidak mendukung pembuatan tabel kalender.

## Skenario penggunaan

Tabel kalender cocok untuk skenario bisnis berikut:

- Reservasi ruang rapat, kendaraan, dan peralatan
- Jadwal proyek, rencana tugas, dan pengaturan tonggak pencapaian
- Jadwal kursus, rencana pelatihan, dan agenda kegiatan
- Rencana piket, catatan penjadwalan, dan rencana inspeksi
- Catatan acara yang perlu dilihat berdasarkan hari, minggu, atau bulan

## Pembuatan dan konfigurasi

Di basis data utama, klik 「Create collection」, lalu pilih 「Calendar collection」 untuk membuat tabel kalender.

Konfigurasi pembuatan tabel kalender pada dasarnya sama dengan tabel biasa. `Preset fields` digunakan untuk mengontrol bidang sistem yang umum digunakan, sedangkan tabel kalender juga akan dilengkapi dengan bidang untuk menyimpan acara berulang.

| Konfigurasi | Keterangan |
| --- | --- |
| Collection display name | Nama tabel data yang ditampilkan di antarmuka, misalnya 「Reservasi ruang rapat」「Jadwal kursus」「Rencana piket」。 |
| Collection name | Nama identitas tabel data yang digunakan untuk referensi internal seperti API, bidang relasi, izin, dan alur kerja. |
| Inherits | Pilih tabel induk yang akan diwarisi. Hanya terlihat jika basis data utama menggunakan PostgreSQL. |
| Categories | Kategori tabel data. Kategori hanya memengaruhi cara pengorganisasian pada antarmuka pengelolaan tabel data, tanpa mengubah struktur tabel data. |
| Description | Deskripsi tabel data. Anda dapat menjelaskan acara apa yang disimpan dalam tabel kalender ini, siapa yang memeliharanya, dan proses bisnis apa yang terkait. |
| Preset fields | Bidang prasetel. Saat membuat tabel kalender, disarankan untuk mempertahankan bidang sistem dan bidang bawaan tabel kalender. |

### Bidang bawaan

Setelah dibuat, tabel kalender biasanya memiliki bidang bawaan berikut. `cron` dan `exclude` digunakan untuk menyimpan aturan acara berulang dan tanggal pengecualian.

| Bidang | Nama bidang | Keterangan |
| --- | --- | --- |
| ID | `id` | Bidang kunci utama default yang digunakan untuk mengidentifikasi satu catatan acara secara unik. |
| Waktu dibuat | `createdAt` | Secara otomatis mencatat waktu pembuatan catatan acara. |
| Dibuat oleh | `createdBy` | Secara otomatis mencatat pengguna yang membuat catatan acara. |
| Waktu diperbarui | `updatedAt` | Secara otomatis mencatat waktu pembaruan terakhir catatan acara. |
| Diperbarui oleh | `updatedBy` | Secara otomatis mencatat pengguna yang terakhir memperbarui catatan acara. |
| Urutan | `sort` | Menyimpan nilai urutan catatan acara untuk mendukung kemampuan seperti pengurutan dengan seret dan lepas. |
| Repeats | `cron` | Menyimpan aturan acara berulang, misalnya pengulangan setiap hari, minggu, bulan, atau tahun. |
| Exclude | `exclude` | Menyimpan tanggal yang dikecualikan dari acara berulang, biasanya dikelola secara otomatis melalui interaksi kalender. |
| Ruang | `space` | Tersedia setelah [plugin multi-ruang](../../multi-app/multi-space/index.md) diaktifkan dan digunakan untuk mengisolasi data berdasarkan ruang. Bidang ini tidak akan muncul jika multi-ruang tidak diaktifkan. |

Saat menggunakan tabel kalender pada blok kalender, Anda juga perlu menentukan bidang bisnis yang digunakan untuk menampilkan acara:

| Konfigurasi | Keterangan |
| --- | --- |
| Bidang judul | Menentukan judul acara di kalender, misalnya 「Topik rapat」「Nama kursus」。 |
| Bidang tanggal mulai | Menentukan waktu mulai acara. Biasanya menggunakan bidang tanggal dan waktu. |
| Bidang tanggal selesai | Menentukan waktu selesai acara. Biasanya menggunakan bidang tanggal dan waktu. |

:::warning Catatan

`cron` dan `exclude` biasanya dikelola oleh kemampuan kalender dan tidak disarankan untuk diedit langsung sebagai bidang bisnis biasa. Bidang judul, tanggal mulai, dan tanggal selesai harus dibuat dan dikonfigurasi sesuai kebutuhan bisnis; jika tidak, blok kalender tidak dapat menampilkan acara dengan benar.

:::

### BIdang kunci utama

Seperti tabel biasa, tabel kalender juga memerlukan bidang kunci utama. Saat membuat tabel, disarankan untuk mempertahankan bidang prasetel ID; tipe kunci utama default adalah `Snowflake ID (53-bit)`.

Jika tabel kalender tidak memiliki kunci utama, Anda perlu mengatur 「Record unique key」 saat mengedit tabel data. Jika tidak, blok kalender mungkin tidak dapat membuka, mengedit, atau menemukan catatan acara dengan benar.

## Edit konfigurasi

Dalam daftar tabel data, klik 「Edit」 di sisi kanan tabel kalender untuk mengubah konfigurasi seperti nama tampilan tabel data, kategori, deskripsi, mode paginasi sederhana, dan 「Record unique key」.

Bidang bawaan `cron`, `exclude`, dan bidang lainnya pada tabel kalender biasanya digunakan oleh kemampuan kalender, sehingga tidak disarankan untuk mengubahnya menjadi makna bisnis lain. Jika perlu menambahkan informasi acara, Anda dapat menambahkan bidang bisnis biasa seperti lokasi, peserta, ruang rapat, dan status.

## Menghapus tabel data

Dalam daftar tabel data, klik 「Delete」 di sisi kanan tabel kalender untuk menghapus tabel kalender.

Menghapus tabel kalender akan menghapus catatan acara, data bidang bawaan kalender, dan metadata Collection terkait. Sebelum menghapus, pastikan apakah blok kalender, blok tabel, izin, alur kerja, dan API masih bergantung pada tabel ini.

:::danger Peringatan

Tabel kalender biasanya menyimpan data jadwal, reservasi, dan piket. Setelah dihapus, acara historis dan aturan pengulangan akan hilang. Pastikan data sudah dicadangkan atau tidak lagi diperlukan sebelum melakukan tindakan ini.

:::

## Penggunaan dalam konfigurasi halaman

Tabel kalender dapat menggunakan sebagian besar blok data dari [tabel biasa](../data-source-main/general-collection.md) untuk melakukan operasi tambah, hapus, ubah, dan lihat. Selain itu, tabel ini biasanya digunakan bersama blok kalender:

| Blok | Kegunaan |
| --- | --- |
| [Blok kalender](../../interface-builder/blocks/data-blocks/calendar.md) | Menampilkan catatan acara berdasarkan tampilan harian, mingguan, bulanan, dan lainnya, serta membuat, melihat, dan mengedit acara di kalender. |
| [Blok tabel](../../interface-builder/blocks/data-blocks/table.md) | Melihat, memfilter, dan mengelola catatan acara secara massal dalam bentuk daftar. |
| [Blok formulir](../../interface-builder/blocks/data-blocks/form.md) | Menambahkan atau mengedit satu catatan acara. |
| [Blok detail](../../interface-builder/blocks/data-blocks/details.md) | Melihat informasi terperinci dari satu acara. |

## Tautan terkait

- [Tabel biasa](../data-source-main/general-collection.md) — Melihat konfigurasi umum dan cara menggunakan blok
- [BIdang tanggal dan waktu](../data-modeling/collection-fields/datetime/datetime.md) — Membuat bidang waktu mulai dan waktu selesai acara
- [Blok kalender](../../interface-builder/blocks/data-blocks/calendar.md) — Menampilkan data dalam bentuk kalender pada halaman
- [Multi-ruang](../../multi-app/multi-space/index.md) — Memahami bidang ruang dan kemampuan isolasi ruang
