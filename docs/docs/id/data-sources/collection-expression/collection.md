---
title: "Collection Expression"
description: "Collection Expression digunakan untuk operasi expression dinamis di workflow, menyimpan aturan komputasi dan formula, mendukung field model data berbeda sebagai variabel, digunakan dengan menghubungkan ke data bisnis."
keywords: "collection expression,expression dinamis,expression workflow,aturan komputasi,formula,NocoBase"
---

# Collection Expression

## Membuat Collection Template "Expression"

Sebelum menggunakan node operasi expression dinamis di dalam workflow, Anda perlu membuat sebuah Collection template "Expression" di alat manajemen Collection, untuk menyimpan berbagai expression:

![Membuat Collection template Expression](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Memasukkan Data Expression

Lalu buat block tabel terhadap Collection template tersebut, dan tambahkan beberapa data formula. Setiap baris data dalam Collection template "Expression" dapat dipahami sebagai aturan komputasi untuk model data Collection tertentu. Setiap baris data formula dapat menggunakan nilai field dari model data Collection berbeda sebagai variabel, dan menulis expression yang berbeda sebagai aturan komputasi. Tentu saja, Anda juga dapat menggunakan engine komputasi yang berbeda.

![Memasukkan data expression](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tips}
Setelah formula dibuat, Anda masih perlu menghubungkan data bisnis dengan formula. Menghubungkan setiap baris data bisnis langsung ke baris data formula akan cukup merepotkan, jadi biasanya kami menggunakan Collection metadata seperti kategori dan menghubungkannya ke Collection formula dengan relasi Many to One (atau One to One), lalu menghubungkan data bisnis dengan metadata kategori menggunakan relasi Many to One. Dengan begitu, saat membuat data bisnis, Anda hanya perlu menentukan metadata kategori tertentu, dan dalam penggunaan selanjutnya, dapat menemukan data formula yang sesuai melalui jalur relasi ini untuk digunakan.
:::

## Memuat Data yang Sesuai dalam Alur

Sebagai contoh, dengan event Collection, buat sebuah workflow yang dipicu saat order dibuat, dan perlu memuat lebih dulu data produk yang terhubung dengan order serta data expression yang terkait dengan produk:

![Konfigurasi trigger event Collection](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
