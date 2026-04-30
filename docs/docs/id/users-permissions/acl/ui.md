---
pkg: '@nocobase/plugin-acl'
title: "Penerapan Izin dalam UI"
description: "Manifestasi izin NocoBase dalam UI: visibilitas blok data, izin operasi lihat, konfigurasi izin global vs khusus, tampilan/penyembunyian elemen antarmuka."
keywords: "izin UI,visibilitas blok data,izin operasi,izin antarmuka,ACL,NocoBase"
---

# Penerapan dalam UI

## Izin Blok Data

Visibilitas blok data tabel data dikontrol oleh izin operasi lihat (izin yang dikonfigurasi secara khusus memiliki prioritas lebih tinggi daripada global)

Seperti gambar di bawah: Pada izin global, admin memiliki semua izin, sedangkan tabel order dikonfigurasi izin khusus (tidak terlihat)

Konfigurasi izin global sebagai berikut:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Konfigurasi izin khusus tabel order sebagai berikut:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

Manifestasi pada UI adalah semua blok tabel order tidak ditampilkan

Alur konfigurasi lengkap sebagai berikut

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Izin Field

Lihat: Mengontrol apakah field terlihat pada level field, misalnya mengontrol field tertentu pada tabel order yang terlihat oleh role tertentu

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Manifestasi pada UI adalah blok tabel order hanya menampilkan field yang memiliki izin yang dikonfigurasi. Field sistem (Id, CreateAt, Last updated at) memiliki izin lihat meskipun tidak dikonfigurasi.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- Edit: Mengontrol apakah field dapat diedit dan disimpan (diperbarui)

Seperti gambar, mengkonfigurasi izin edit field tabel order (kuantitas dan produk terkait memiliki izin edit)

![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

Manifestasi pada UI adalah blok formulir operasi edit blok tabel order hanya menampilkan field yang memiliki izin edit

![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

Alur konfigurasi lengkap sebagai berikut:

![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- Tambah: Mengontrol apakah field dapat ditambahkan (dibuat)

Seperti gambar, mengkonfigurasi izin tambah field tabel order (nomor order, kuantitas, produk, pengiriman memiliki izin tambah)

![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

Manifestasi pada UI adalah blok formulir operasi tambah blok tabel order hanya menampilkan field yang memiliki izin tambah

![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- Ekspor: Mengontrol apakah field dapat diekspor
- Impor: Mengontrol apakah field mendukung impor

## Izin Operasi

Izin yang dikonfigurasi secara khusus memiliki prioritas tertinggi. Jika ada konfigurasi khusus, izin akan mengikuti konfigurasi khusus; jika tidak ada, akan mengikuti izin yang dikonfigurasi secara global.

- Tambah, mengontrol apakah tombol operasi tambah ditampilkan di blok

Seperti gambar, tabel order dikonfigurasi izin operasi khusus, mengizinkan tambah

![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

Manifestasi pada UI adalah tombol tambah ditampilkan di area operasi blok tabel order

![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- Lihat

Mengontrol apakah blok data ditampilkan

Seperti gambar, konfigurasi izin global sebagai berikut (tidak ada izin lihat)

![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

Konfigurasi izin khusus tabel order sebagai berikut

![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

Manifestasi pada UI adalah: blok semua tabel data lain tidak ditampilkan, blok tabel order ditampilkan.

Alur konfigurasi contoh lengkap sebagai berikut

![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- Edit

Mengontrol apakah tombol operasi edit di dalam blok ditampilkan

![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

Dengan mengatur data scope, dapat lebih lanjut mengontrol izin operasi

Seperti gambar, mengatur tabel data order sehingga pengguna hanya dapat mengedit data milik sendiri

![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- Hapus

Mengontrol tampilan tombol operasi hapus pada blok

![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- Ekspor

Mengontrol tampilan tombol operasi ekspor pada blok

- Impor

Mengontrol tampilan tombol operasi impor pada blok

## Izin Relasi

### Sebagai Field

- Izin field relasi dikontrol oleh izin field tabel sumber, mengontrol apakah seluruh komponen field relasi ditampilkan

Seperti gambar, field relasi customer pada tabel order hanya memiliki izin lihat, impor, dan ekspor

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Manifestasi pada UI adalah field relasi customer tidak ditampilkan pada blok operasi tambah dan edit blok tabel order

Alur konfigurasi contoh lengkap sebagai berikut

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Izin field di dalam komponen field relasi (seperti subtable/subform) ditentukan oleh izin tabel data target

Saat komponen field relasi adalah subform:

Seperti gambar, field relasi "customer" pada tabel order, field relasi "customer" pada order memiliki semua izin, sedangkan tabel customer dikonfigurasi izin khusus sebagai read-only

Konfigurasi izin khusus tabel order sebagai berikut, field relasi "customer" memiliki semua izin field

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Konfigurasi izin khusus tabel customer sebagai berikut, field pada tabel customer hanya memiliki izin lihat

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Manifestasi pada UI: pada blok tabel order, field relasi customer terlihat. Saat beralih ke subform (field di dalam subform terlihat dalam detail, tetapi tidak ditampilkan pada operasi tambah dan edit)

Alur konfigurasi contoh lengkap sebagai berikut

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Mengontrol lebih lanjut izin field di dalam subform: field tertentu memiliki izin

Seperti gambar, tabel customer dikonfigurasi izin field khusus (nama customer tidak terlihat dan tidak dapat diedit)

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Alur konfigurasi contoh lengkap sebagai berikut

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Saat komponen field relasi adalah subtable, situasinya sama dengan subform:

Seperti gambar, ada field relasi "shipment" pada tabel order, field relasi "shipment" pada order memiliki semua izin, sedangkan tabel shipment dikonfigurasi izin khusus sebagai read-only

Manifestasi pada UI: field relasi tersebut terlihat. Saat beralih ke subtable (field di dalam subtable terlihat pada operasi lihat, tetapi tidak terlihat pada operasi tambah dan edit)

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Mengontrol lebih lanjut izin field di dalam subtable: field tertentu memiliki izin

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Sebagai Blok

- Blok relasi dikontrol oleh izin tabel target field relasi yang sesuai, tidak terkait dengan izin field relasi

Seperti gambar, apakah blok relasi "customer" ditampilkan dikontrol oleh izin tabel customer

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Field di dalam blok relasi dikontrol oleh izin field di tabel target

Seperti gambar, mengatur field tertentu pada tabel customer untuk memiliki izin lihat

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)
