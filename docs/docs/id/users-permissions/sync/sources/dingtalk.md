---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Menyinkronkan Data Pengguna dari DingTalk"
description: "Sinkronkan pengguna dan departemen DingTalk ke NocoBase serta terima perubahan inkremental melalui callback HTTP atau mode Stream."
keywords: "DingTalk,sinkronisasi pengguna,sinkronisasi departemen,mode Stream,langganan event,NocoBase"
---

# Menyinkronkan Data Pengguna dari DingTalk

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Pengantar

Plugin **DingTalk** menyinkronkan pengguna dan departemen organisasi DingTalk ke NocoBase. Plugin ini mendukung sinkronisasi penuh manual dan pembaruan inkremental melalui callback HTTP atau koneksi Stream.

## Persiapan

1. Instal dan aktifkan plugin **DingTalk** dan **Sinkronisasi Data Pengguna**.
2. Buat aplikasi internal perusahaan di konsol pengembang DingTalk.
3. Berikan izin kontak dan atur cakupan izin data seperti dijelaskan di bawah.
4. Salin Client ID dan Client Secret. Lihat [Autentikasi: DingTalk](/auth-verification/auth-dingtalk/).

## Mengatur izin kontak dan cakupan izin data

Buka **Manajemen Izin** aplikasi di DingTalk dan berikan izin berikut:

| Izin | Identifikasi | Wajib | Kegunaan |
| --- | --- | --- | --- |
| Membaca informasi departemen | `qyapi_get_department_list` | Ya | Membaca daftar, nama, dan hierarki departemen. |
| Membaca anggota departemen | `qyapi_get_department_member` | Ya | Membaca anggota setiap departemen. |
| Membaca informasi anggota | `qyapi_get_member` | Ya | Membaca detail pengguna dan keanggotaan departemen. |
| Informasi nomor seluler karyawan | `fieldMobile` | Saat memakai nomor seluler | Menyinkronkan nomor telepon; wajib bila pengenal unik adalah `mobile`. |
| Email dan informasi pribadi lainnya | `fieldEmail` | Tidak | Diperlukan untuk menyinkronkan alamat email. |

Atur juga **Cakupan Izin Data** agar mencakup departemen dan karyawan yang boleh disinkronkan. Pilih semua karyawan untuk sinkronisasi seluruh organisasi.

:::warning
Izin API menentukan field yang dapat dibaca, sedangkan cakupan izin data menentukan departemen dan karyawan yang dapat dibaca. Keduanya wajib dikonfigurasi. Langganan event tidak menggantikan izin baca kontak.
:::

Jika aplikasi yang sama juga dipakai untuk login, tambahkan izin informasi pribadi yang dijelaskan di [Autentikasi: DingTalk](/auth-verification/auth-dingtalk/).

## Menambahkan sumber sinkronisasi DingTalk

Buka **Pengguna & Izin > Sinkronkan**, klik **Tambah**, lalu pilih **DingTalk**.

| Field | Keterangan |
| --- | --- |
| Nama sumber | Nama unik sumber sinkronisasi. |
| Aktif | Memulai penerimaan event dan mengizinkan tugas sinkronisasi. |
| Client ID | Client ID aplikasi; mendukung variabel lingkungan dan secret. |
| Client Secret | Client Secret aplikasi; mendukung variabel lingkungan dan secret. |
| Pengenal unik pengguna | `mobile` atau `unionId`. Jangan ubah setelah sinkronisasi pertama. Pengguna tanpa nilai yang dipilih akan dilewati. |
| Mode penerimaan event | **Callback HTTP** atau **mode Stream** untuk perubahan inkremental. |

Simpan dan aktifkan sumber, lalu klik **Sinkronkan** untuk menjalankan sinkronisasi penuh pertama.

## Memilih mode penerimaan event

### Mode Stream

Mode Stream membuat koneksi persisten keluar dari server NocoBase ke DingTalk. URL callback publik, Token, dan EncodingAESKey tidak diperlukan.

1. Pilih **mode Stream** pada pengaturan langganan event DingTalk.
2. Langgan event perubahan pengguna dan departemen yang diperlukan.
3. Pilih **mode Stream** di NocoBase, simpan, dan aktifkan sumber.

Klien Stream dimulai saat sumber diaktifkan. Pembaruan, penonaktifan, atau penghapusan sumber akan memperbarui atau menutup koneksi.

:::info
Server NocoBase harus dapat membuat koneksi keluar ke DingTalk. Mode Stream tidak memerlukan reverse proxy atau endpoint masuk publik.
:::

### Callback HTTP

1. Pilih **Callback HTTP** di NocoBase.
2. Masukkan Token dan EncodingAESKey dari konfigurasi event DingTalk.
3. Simpan sumber dan salin **URL callback event** yang dibuat.
4. Atur URL tersebut di DingTalk dan langgan event pengguna serta departemen.

URL callback harus dapat diakses DingTalk. Gunakan HTTPS di produksi dan pastikan reverse proxy meneruskan path secara utuh.

## Event inkremental yang didukung

| Event | Penanganan di NocoBase |
| --- | --- |
| `user_add_org` | Membuat atau memperbarui pengguna. |
| `user_modify_org` | Memperbarui pengguna. |
| `user_leave_org` | Menghapus pengguna yang disinkronkan. |
| `org_dept_create` | Membuat atau memperbarui departemen. |
| `org_dept_modify` | Memperbarui departemen dan menyinkronkan penggunanya. |
| `org_dept_remove` | Menghapus departemen yang disinkronkan. |

## Field yang disinkronkan

### Field departemen

| Field DingTalk | Field atau kegunaan NocoBase |
| --- | --- |
| `dept_id` | Pengenal unik departemen dari sumber. |
| `name` | Nama departemen. |
| `parent_id` | Departemen induk. Jika di luar cakupan data, departemen disinkronkan sebagai departemen akar. |

### Field pengguna

| Field DingTalk | Field atau kegunaan NocoBase |
| --- | --- |
| `mobile` atau `unionid` | Pengenal unik sumber dan username sesuai konfigurasi. |
| `name` | Nama panggilan pengguna. |
| `mobile` | Nomor telepon. Memerlukan `fieldMobile`. |
| `email`, dengan fallback `org_email` | Alamat email. Memerlukan `fieldEmail`. |
| `dept_id_list` | Keanggotaan departemen dalam cakupan izin data. |
| `dept_order_list` | Departemen utama. |
| `leader_in_dept` | Menandai apakah pengguna adalah penanggung jawab departemen. |

### Penanggung jawab departemen

NocoBase menyinkronkan `leader_in_dept` secara terpisah untuk setiap departemen. Seorang pengguna dapat bertanggung jawab atas beberapa departemen, terlepas dari departemen utamanya. Jika tanda dihapus di DingTalk, sinkronisasi berikutnya akan menghapusnya di NocoBase. Perubahan manual dapat ditimpa.

Sinkronisasi penuh dan inkremental memakai pemetaan field yang sama. Avatar, jabatan, dan nomor karyawan belum disinkronkan.

## Pemecahan masalah

- Jika data kosong atau tidak lengkap, periksa tiga izin wajib dan cakupan izin data.
- Jika nomor seluler atau email kosong, periksa `fieldMobile` dan `fieldEmail`.
- Pengguna tanpa pengenal unik yang dikonfigurasi akan dilewati.
- Untuk Stream, periksa log `Dingtalk stream client starting`, `Dingtalk stream client started`, dan error koneksi.
- Untuk callback HTTP, periksa akses publik, Token, dan EncodingAESKey.
- Jalankan ulang sinkronisasi penuh setelah mengubah izin atau cakupan data.
