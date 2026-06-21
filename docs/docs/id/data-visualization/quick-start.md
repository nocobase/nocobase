---
title: "Mulai Cepat Data Visualization"
description: "Konfigurasikan Chart dari nol: tambahkan blok Chart, konfigurasikan query data (ukuran/dimensi), jalankan query, pemetaan field, preview dan simpan—5 langkah untuk menyelesaikan panel visualisasi pertama Anda."
keywords: "mulai cepat data visualization,konfigurasi chart,ukuran,dimensi,pemetaan field,pengantar cepat,NocoBase"
---

# Mulai Cepat

Mari mulai mengkonfigurasi sebuah Chart dari nol dengan menggunakan fitur dasar yang diperlukan. Kemampuan opsional lainnya akan dibahas pada bagian selanjutnya.

Persiapan awal:
- Sumber data dan koleksi (tabel data) sudah dikonfigurasi dan Anda memiliki izin baca.

## Tambahkan Blok Chart

Di Page Designer, klik "Tambahkan Blok", pilih "Chart", lalu tambahkan sebuah blok Chart.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Setelah ditambahkan, klik "Konfigurasi" di pojok kanan atas blok.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Panel konfigurasi Chart akan terbuka di sebelah kanan. Berisi tiga bagian: Query Data, Opsi Chart, dan Event.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Konfigurasikan Query Data
Pada panel "Query Data", Anda dapat mengkonfigurasi sumber data, kondisi filter query, dan lainnya.

- Pertama, pilih sumber data dan koleksi
  - Pada panel "Query Data" pilih sumber data dan koleksi sebagai dasar query.
  - Jika koleksi tidak dapat dipilih atau kosong, periksa terlebih dahulu apakah koleksi sudah dibuat dan izin pengguna saat ini.

- Konfigurasikan Ukuran (Measures)
  - Pilih satu atau beberapa field numerik sebagai ukuran.
  - Atur agregasi untuk setiap ukuran: Sum / Count / Avg / Max / Min.

- Konfigurasikan Dimensi (Dimensions)
  - Pilih satu atau beberapa field sebagai dimensi pengelompokan (tanggal, kategori, wilayah, dll.).
  - Field tanggal/waktu dapat diatur formatnya (seperti `YYYY-MM`, `YYYY-MM-DD`) untuk tampilan yang seragam.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Kondisi lainnya: filter, sortir, paginasi bersifat opsional.


## Jalankan Query dan Lihat Data

- Klik "Jalankan Query", data akan diminta dan Chart preview akan dirender (preview langsung pada halaman di sebelah kiri).
- Anda dapat klik "Lihat Data" untuk preview hasil data yang dikembalikan, mendukung peralihan format Table/JSON. Klik lagi untuk menyembunyikan preview data.
- Saat hasil data kosong atau tidak sesuai harapan, kembali ke panel query untuk memeriksa izin koleksi, pemetaan field ukuran/dimensi, dan tipe data.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Konfigurasikan Opsi Chart

Pada panel "Opsi Chart", Anda dapat memilih Chart dan mengkonfigurasi opsi Chart.

- Pertama pilih jenis Chart (line/area, bar/column, pie/donut, scatter, dll.).
- Selesaikan pemetaan field inti:
  - Line/Area/Bar/Column: `xField` (dimensi), `yField` (ukuran), `seriesField` (seri, opsional)
  - Pie/Donut: `Category` (dimensi kategori), `Value` (ukuran)
  - Scatter: `xField`, `yField` (dua ukuran atau dimensi)
  - Untuk lebih banyak grafik dan konfigurasi, lihat dokumentasi ECharts [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Setelah klik "Jalankan Query" sebelumnya, pemetaan field akan diselesaikan secara otomatis secara default; setelah mengubah dimensi/ukuran, konfirmasikan ulang pemetaan.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Preview dan Simpan
Perubahan konfigurasi akan secara default memperbarui preview secara real-time, dan Anda dapat melihat Chart pada halaman di sebelah kiri. Namun perlu dicatat bahwa sebelum klik tombol "Simpan", semua perubahan belum benar-benar disimpan.

Anda juga dapat klik tombol di bagian bawah:

- Preview: perubahan konfigurasi akan otomatis merefresh preview secara real-time, Anda juga dapat klik tombol "Preview" di bagian bawah untuk memicu refresh secara manual.
- Batal: jika Anda tidak ingin menyimpan perubahan saat ini, klik tombol "Batal" di bagian bawah, atau refresh halaman; perubahan akan dibatalkan dan kembali ke status simpan sebelumnya.
- Simpan: klik "Simpan" untuk benar-benar menyimpan semua konfigurasi query dan Chart saat ini ke database, berlaku untuk semua pengguna.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Catatan Umum

- Konfigurasi minimum yang dapat digunakan: pilih koleksi + setidaknya satu ukuran; disarankan menambahkan dimensi untuk memudahkan tampilan pengelompokan.
- Dimensi tanggal disarankan diatur dengan format yang sesuai (seperti `YYYY-MM` untuk statistik bulanan), untuk menghindari sumbu horizontal yang tidak kontinu atau berantakan.
- Query kosong atau Chart tidak ditampilkan:
  - Periksa koleksi/izin dan pemetaan field;
  - Konfirmasikan nama kolom dan tipe sesuai dengan pemetaan Chart pada "Lihat Data".
- Preview adalah status sementara: hanya untuk verifikasi dan penyesuaian, akan resmi berlaku setelah klik "Simpan".
