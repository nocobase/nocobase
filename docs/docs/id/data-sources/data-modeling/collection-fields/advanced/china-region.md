---
title: "Wilayah Administratif Tiongkok"
description: "Field wilayah administratif Tiongkok, mendukung pemilihan tiga tingkat (provinsi/kota/kabupaten) yang saling terkait, cocok untuk skenario seperti alamat, asal daerah."
keywords: "Wilayah Administratif Tiongkok,provinsi kota kabupaten,field wilayah administratif,tiga tingkat terkait,NocoBase"
---

# Wilayah Administratif Tiongkok

<PluginInfo name="field-china-region"></PluginInfo>

## Pengantar

Field Wilayah Administratif Tiongkok digunakan untuk menyimpan informasi wilayah administratif Tiongkok seperti provinsi, kota, kabupaten/kecamatan dalam Collection. Field ini berbasis Collection wilayah administratif `chinaRegions` bawaan, menyediakan cascading selector. Pengguna dapat memilih provinsi, kota, dan kabupaten secara berurutan dalam form.

Skenario penggunaan meliputi:

- Lokasi record pelanggan, kontak, toko, proyek, dan lainnya
- Informasi alamat dasar seperti tempat tinggal, asal daerah, area pengiriman
- Data yang perlu difilter atau distatistik berdasarkan provinsi/kota/kabupaten

Nilai field disimpan dalam bentuk record terkait, secara default terhubung ke Collection `chinaRegions`, dan ditampilkan terurut berdasarkan tingkat wilayah administratif. Misalnya, setelah memilih "Beijing / Wilayah Kota / Distrik Dongcheng", tampilan akan disusun secara hierarkis menjadi jalur lengkap.

## Konfigurasi Field

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

Saat membuat field, pilih tipe field "Wilayah Administratif Tiongkok", Anda dapat mengonfigurasi opsi berikut:

| Opsi Konfigurasi | Deskripsi |
| --- | --- |
| Pilih Tingkat | Mengontrol tingkat terdalam yang dapat dipilih. Saat ini mendukung "Provinsi", "Kota", "Kabupaten", default adalah "Kabupaten". "Kelurahan" dan "Desa" dalam keadaan dinonaktifkan di antarmuka. |
| Harus Memilih Sampai Tingkat Terakhir | Jika dicentang, pengguna harus memilih sampai tingkat terdalam yang dikonfigurasi sebelum dapat submit; jika tidak dicentang, dapat menyelesaikan pemilihan pada tingkat menengah. |

## Penggunaan UI

Dalam form, field Wilayah Administratif Tiongkok ditampilkan sebagai cascading selector:

1. Saat dropdown dibuka, data tingkat provinsi dimuat.
2. Saat memperluas suatu provinsi, kota di bawahnya dimuat sesuai kebutuhan.
3. Saat memperluas kota, kabupaten/kecamatan dimuat sesuai kebutuhan.
4. Setelah disimpan, dalam skenario tampilan seperti detail dan tabel, ditampilkan secara hierarkis sebagai `Provinsi/Kota/Kabupaten`.

Field mendukung konfigurasi form umum, seperti judul field, deskripsi, wajib diisi, nilai default, mode baca, dan lainnya. Dalam mode baca, field akan ditampilkan sebagai jalur teks, contohnya:

```text
Beijing / Wilayah Kota / Distrik Dongcheng
```

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

## Perhatian

- Field Wilayah Administratif Tiongkok saat ini hanya mendukung pemilihan jalur tunggal, tidak mendukung multi pilihan.
- Saat ini data yang dibawakan dan diaktifkan adalah tiga tingkat: provinsi, kota, kabupaten. Opsi tingkat kelurahan dan desa untuk sementara tidak dapat dipilih.
- Saat impor, perlu mengisi nama yang konsisten dengan data wilayah administratif bawaan, dan dipisahkan dengan `/` per tingkat.
- Field ini bergantung pada Collection `chinaRegions` yang disediakan plugin, harap pastikan plugin field "Wilayah Administratif Tiongkok" telah diaktifkan.
