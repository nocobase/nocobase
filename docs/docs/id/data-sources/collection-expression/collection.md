---
title: "Tabel Ekspresi"
description: "Tabel ekspresi digunakan untuk operasi ekspresi dinamis dalam alur kerja, menyimpan aturan perhitungan dan rumus, mendukung penggunaan bidang dari berbagai model data sebagai variabel, serta dikaitkan dengan data bisnis."
keywords: "tabel ekspresi,ekspresi dinamis,ekspresi alur kerja,aturan perhitungan,rumus,NocoBase"
---

# Tabel ekspresi

## Membuat tabel templat "ekspresi"

Sebelum menggunakan node operasi ekspresi dinamis dalam alur kerja, Anda perlu membuat tabel templat "ekspresi" terlebih dahulu melalui alat pengelolaan tabel data untuk menyimpan berbagai ekspresi:

![Membuat tabel templat ekspresi](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Memasukkan data ekspresi

Kemudian buat blok tabel untuk menambahkan beberapa data rumus ke tabel templat tersebut. Setiap baris data dalam tabel templat "ekspresi" dapat dipahami sebagai aturan perhitungan untuk model data tabel tertentu. Setiap baris data rumus dapat menggunakan nilai bidang dari model data tabel yang berbeda sebagai variabel, lalu menulis ekspresi yang berbeda sebagai aturan perhitungan. Anda juga dapat menggunakan mesin perhitungan yang berbeda.

![Memasukkan data ekspresi](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Catatan}
Setelah membuat rumus, Anda juga perlu mengaitkan data bisnis dengan rumus. Mengaitkan setiap baris data bisnis secara langsung dengan baris data rumus akan cukup merepotkan, sehingga biasanya kita menggunakan tabel metadata klasifikasi dan tabel rumus untuk membuat relasi banyak-ke-satu (atau satu-ke-satu), kemudian mengaitkan data bisnis dengan metadata klasifikasi melalui relasi banyak-ke-satu. Dengan demikian, saat membuat data bisnis, Anda hanya perlu menentukan metadata klasifikasi tertentu, lalu dalam penggunaan selanjutnya dapat menemukan dan menggunakan data rumus yang sesuai melalui jalur relasi ini.
:::

## Memuat data terkait dalam alur

Sebagai contoh, buat alur kerja berdasarkan peristiwa tabel data yang dipicu saat pesanan dibuat, dan perlu melakukan pramuat data produk yang terkait dengan pesanan serta data ekspresi yang terkait dengan produk:

![Konfigurasi pemicu peristiwa tabel data](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
