---
pkg: '@nocobase/plugin-user-data-sync'
title: "Sinkronisasi Data Pengguna dari WeCom"
description: "Sinkronisasi data pengguna NocoBase dari WeCom: aplikasi mandiri WeCom, Company ID, AgentId, Secret, sinkronisasi kontak, konfigurasi Trusted IP."
keywords: "WeCom,sinkronisasi pengguna,sinkronisasi kontak,AgentId,Secret,NocoBase"
---

# Sinkronisasi Data Pengguna dari WeCom

<PluginInfo commercial="true" name="wecom"></PluginInfo>

## Pengantar

Plugin **WeCom** mendukung pengguna untuk menyinkronkan data pengguna dan departemen dari WeCom.

## Membuat dan Mengkonfigurasi Aplikasi Mandiri WeCom

Pertama, Anda perlu membuat aplikasi mandiri WeCom di admin backend WeCom, dan mendapatkan **Company ID**, **AgentId**, dan **Secret**.

Lihat [Autentikasi Pengguna - WeCom](/auth-verification/auth-wecom/index.md).

## Menambahkan Sumber Data Sinkronisasi di NocoBase

Pengguna dan Izin - Sinkronisasi - Tambah, isi informasi terkait yang didapatkan.

![](https://static-docs.nocobase.com/202412041251867.png)

## Mengkonfigurasi Sinkronisasi Kontak

Masuk ke admin backend WeCom - Keamanan dan Manajemen - Alat Manajemen, klik Sinkronisasi Kontak.

![](https://static-docs.nocobase.com/202412041249958.png)

Atur sesuai gambar di bawah, dan atur Trusted IP perusahaan.

![](https://static-docs.nocobase.com/202412041250776.png)

Selanjutnya, Anda dapat melakukan sinkronisasi data pengguna.

## Mengatur Server Penerima Event

Jika Anda ingin perubahan data pengguna dan departemen di sisi WeCom dapat segera disinkronkan ke aplikasi NocoBase, Anda dapat melakukan pengaturan lebih lanjut.

Setelah mengisi informasi konfigurasi sebelumnya, Anda dapat menyalin alamat callback notifikasi sinkronisasi kontak.

![](https://static-docs.nocobase.com/202412041256547.png)

Isi pada pengaturan WeCom, dapatkan Token dan EncodingAESKey, lalu lengkapi konfigurasi sumber data sinkronisasi pengguna NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)
