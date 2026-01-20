---
pkg: '@nocobase/plugin-verification'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Verifikasi: SMS

## Pendahuluan

Kode verifikasi SMS adalah tipe verifikasi bawaan yang digunakan untuk menghasilkan kata sandi dinamis satu kali (OTP) dan mengirimkannya kepada pengguna melalui SMS.

## Menambahkan Verifier SMS

Buka halaman manajemen verifikasi.

![](https://static-docs.nocobase.com/202502271726791.png)

Tambahkan - OTP SMS

![](https://static-docs.nocobase.com/202502271726056.png)

## Konfigurasi Administrator

![](https://static-docs.nocobase.com/202502271727711.png)

Penyedia layanan SMS yang saat ini didukung adalah:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Saat mengonfigurasi template SMS di panel admin penyedia layanan, Anda perlu menyediakan parameter untuk kode verifikasi.

- Contoh konfigurasi Aliyun: `Kode verifikasi Anda adalah: ${code}`

- Contoh konfigurasi Tencent Cloud: `Kode verifikasi Anda adalah: {1}`

Pengembang juga dapat memperluas dukungan untuk penyedia layanan SMS lainnya dalam bentuk plugin. Lihat: [Memperluas Penyedia Layanan SMS](./dev/sms-type)

## Penautan Pengguna

Setelah menambahkan verifier, pengguna dapat menautkan nomor telepon di manajemen verifikasi pribadi mereka.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Setelah penautan berhasil, verifikasi identitas dapat dilakukan di skenario verifikasi mana pun yang menggunakan verifier ini.

![](https://static-docs.nocobase.com/202502271739607.png)

## Melepaskan Tautan Pengguna

Melepaskan tautan nomor telepon memerlukan verifikasi melalui metode yang sudah tertaut.

![](https://static-docs.nocobase.com/202502282103205.png)