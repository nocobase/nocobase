---
title: "Wilayah Administratif Tiongkok"
description: "Field wilayah administratif Tiongkok digunakan untuk menyimpan informasi pembagian administratif seperti provinsi, kota, dan distrik/kabupaten, serta mendukung pemilihan berjenjang tiga tingkat dan tampilan berdasarkan hierarki."
keywords: "Wilayah administratif Tiongkok, provinsi-kota-distrik, field pembagian administratif, pemilihan tiga tingkat,NocoBase"
---

# Wilayah Administratif Tiongkok

<PluginInfo name="field-china-region"></PluginInfo>

## Pendahuluan

Di NocoBase, **wilayah administratif Tiongkok (China region)** digunakan untuk menyimpan informasi pembagian administratif Tiongkok seperti provinsi, kota, dan distrik/kabupaten.

Field wilayah administratif Tiongkok didasarkan pada tabel data pembagian administratif bawaan `chinaRegions`, dan menggunakan pemilih berjenjang untuk memasukkan data di halaman. Pengguna dapat memilih provinsi, kota, dan distrik secara berurutan berdasarkan hierarki. Saat ditampilkan, pilihan tersebut akan digabungkan menjadi jalur lengkap sesuai hierarkinya.

Jika perlu menyimpan alamat detail seperti jalan dan nomor rumah, field ini dapat digunakan bersama field [teks satu baris](../basic/input.md) atau [teks beberapa baris](../basic/textarea.md).

## Skenario penggunaan

Wilayah administratif Tiongkok cocok untuk skenario bisnis berikut:

- Lokasi pelanggan, kontak, toko, dan proyek
- Informasi dasar alamat seperti tempat tinggal terdaftar, tempat asal, dan wilayah pengiriman
- Wilayah layanan, wilayah penjualan, dan wilayah pelaksanaan proyek
- Data yang perlu difilter atau dihitung berdasarkan provinsi, kota, dan distrik

## Pembuatan dan konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」 lalu pilih 「中国行政区」 untuk membuat field wilayah administratif Tiongkok.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Untuk wilayah administratif Tiongkok, nilainya adalah `chinaRegion`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama field yang ditampilkan di antarmuka, misalnya 「所在地区」「服务区域」「收货地区」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah setelah dibuat. Hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Jenis field pada lapisan data. Wilayah administratif Tiongkok biasanya disimpan sebagai record relasi atau nilai terstruktur, bergantung pada konfigurasi field. |
| Tingkat pilihan | Mengontrol tingkat terdalam yang dapat dipilih. Saat ini mendukung 「provinsi」「kota」「distrik」, dengan nilai bawaan 「distrik」. |
| Wajib memilih hingga tingkat terakhir | Jika diaktifkan, pengguna harus memilih hingga tingkat terdalam yang dikonfigurasi sebelum dapat mengirimkan data. Jika tidak diaktifkan, pengguna dapat menyelesaikan pilihan pada tingkat perantara. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk mengatur kewajiban pengisian dan tingkat pilihan. |
| Description | Deskripsi field. Dapat digunakan untuk menuliskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaan sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur field

Perilaku bawaan field wilayah administratif Tiongkok adalah sebagai berikut:

| Fitur | Deskripsi |
| --- | --- |
| Field interface bawaan | `chinaRegion`. |
| Sumber data | Tabel data pembagian administratif bawaan `chinaRegions`. |
| Komponen halaman | Menggunakan pemilih berjenjang dalam mode edit. |
| Tingkat pilihan | Saat ini mendukung tiga tingkat: provinsi, kota, dan distrik. |
| Cara menampilkan | Dalam mode baca, ditampilkan berdasarkan hierarki sebagai `省 / 市 / 区`. |
| Filter | Mendukung pemfilteran berdasarkan nilai wilayah yang telah disimpan. Kemampuan spesifik bergantung pada konfigurasi field dan blok halaman. |
| Pilihan ganda | Tidak mendukung pilihan ganda. |

## Edit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field wilayah administratif Tiongkok. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, misalnya mengubah nama tampilan, deskripsi, aturan validasi, tingkat pilihan, atau apakah pengguna wajib memilih hingga tingkat terakhir.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan melalui pemetaan field—memetakan field database ke Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama field yang ditampilkan di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir pengeditan setelah field dibuat. |
| Field interface | Bergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara data dimasukkan, ditampilkan, dan divalidasi di halaman. |
| Field type | Bergantung kondisi | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan jenis baru. |
| Tingkat pilihan | Ya | Menyesuaikan apakah field dapat dipilih hingga tingkat provinsi, kota, atau distrik. |
| Wajib memilih hingga tingkat terakhir | Ya | Mengontrol apakah pengguna wajib memilih hingga tingkat terdalam yang dikonfigurasi saat mengirimkan data. |
| Validation rules | Ya | Menyesuaikan aturan validasi seperti kewajiban pengisian. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Field wilayah administratif Tiongkok bergantung pada tabel data `chinaRegions` yang disediakan plugin. Sebelum digunakan, pastikan plugin field 「中国行政区划」 telah diaktifkan.

:::

## Menghapus field

Klik 「Delete」 di sebelah kanan field untuk menghapus field wilayah administratif Tiongkok. Di database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field wilayah administratif Tiongkok yang dibuat di database utama, kolom fisik di database beserta data yang ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Menghapus field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan dalam konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field wilayah administratif Tiongkok cocok digunakan untuk skenario alamat, wilayah, dan statistik.

| Skenario | Penggunaan |
| --- | --- |
| Blok formulir | Menggunakan pemilih berjenjang untuk memilih provinsi, kota, dan distrik/kabupaten. |
| Blok detail | Menampilkan jalur pembagian administratif. |
| Blok tabel | Menampilkan wilayah tempat record berada. |
| Blok filter | Memfilter record berdasarkan wilayah. |
| Blok diagram | Menghitung data bisnis berdasarkan provinsi, kota, dan distrik. |

### Mode edit

Dalam mode edit, field wilayah administratif Tiongkok ditampilkan sebagai pemilih berjenjang.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Mode baca

Dalam mode baca, field wilayah administratif Tiongkok akan ditampilkan sebagai jalur teks, misalnya:

```text
北京市 / 市辖区 / 东城区
```

## Tautan terkait

- [Field](../index.md) — Pelajari fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Teks satu baris](../basic/input.md) — Menyimpan alamat detail
- [Teks beberapa baris](../basic/textarea.md) — Menyimpan keterangan alamat yang lebih panjang