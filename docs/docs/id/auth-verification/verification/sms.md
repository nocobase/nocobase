---
pkg: '@nocobase/plugin-verification'
title: "Verifikasi: SMS"
description: "Kode verifikasi SMS: tipe verifikasi SMS OTP, mendukung provider SMS Alibaba Cloud dan Tencent Cloud, pengikatan nomor telepon pengguna, konfigurasi administrator, dan alur pelepasan ikatan."
keywords: "kode verifikasi SMS,SMS OTP,Alibaba Cloud SMS,Tencent Cloud SMS,pengikatan nomor telepon,NocoBase"
---

# Verifikasi: SMS

## Pengantar

Kode verifikasi SMS adalah tipe verifikasi bawaan, digunakan untuk menghasilkan one-time password (OTP) dan mengirimkannya ke pengguna melalui SMS.

## Menambahkan Verifier SMS

Masuk ke halaman manajemen verifikasi.

![](https://static-docs.nocobase.com/202502271726791.png)

Tambahkan - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Konfigurasi Administrator

![](https://static-docs.nocobase.com/202502271727711.png)

Provider SMS yang saat ini didukung:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Alibaba Cloud SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Saat mengkonfigurasi template SMS pada admin backend provider, perlu menyiapkan parameter untuk kode verifikasi SMS.

- Contoh konfigurasi Alibaba Cloud: `Kode verifikasi Anda adalah: ${code}`

- Contoh konfigurasi Tencent Cloud: `Kode verifikasi Anda adalah: {1}`

Developer juga dapat memperluas provider SMS lain dalam bentuk plugin. Lihat: [Memperluas Provider SMS](./dev/sms-type)

## Pengikatan Pengguna

Setelah verifier ditambahkan, pengguna dapat mengikat nomor telepon verifikasi pada manajemen verifikasi pribadi.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Setelah pengikatan berhasil, Anda dapat melakukan verifikasi identitas pada skenario verifikasi yang terikat dengan verifier tersebut.

![](https://static-docs.nocobase.com/202502271739607.png)

## Pelepasan Ikatan Pengguna

Pelepasan ikatan nomor telepon perlu dilakukan dengan verifikasi melalui metode verifikasi yang telah diikat.

![](https://static-docs.nocobase.com/202502282103205.png)
