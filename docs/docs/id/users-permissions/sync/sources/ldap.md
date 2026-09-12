---
pkg: '@nocobase/plugin-auth-ldap'
title: "Menyinkronkan Data Pengguna dari LDAP"
description: "Sinkronkan pengguna dan departemen LDAP ke NocoBase dengan menggunakan kembali autentikator LDAP yang ada."
keywords: "LDAP,sinkronisasi pengguna,sinkronisasi departemen,Bind DN,Search DN,NocoBase"
---

# Menyinkronkan Data Pengguna dari LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Pengantar

Plugin **Autentikasi: LDAP** dapat memakai autentikator LDAP yang ada sebagai sumber sinkronisasi. Koneksi, Bind DN, Search DN, cakupan pencarian, dan pemetaan atribut digunakan kembali, lalu pengguna dan hierarki departemen opsional ditulis ke NocoBase.

## Persiapan

1. Instal dan aktifkan **Autentikasi: LDAP** dan **Sinkronisasi Data Pengguna**.
2. Buat dan uji autentikator LDAP. Lihat [Autentikasi: LDAP](/auth-verification/auth-ldap/).
3. Pastikan pemetaan atribut mencakup field yang diperlukan, seperti username atau email, nama panggilan, dan telepon.

## Menambahkan sumber LDAP

Buka **Pengguna & Izin > Sinkronkan**, klik **Tambah**, lalu pilih **LDAP**.

| Field | Keterangan |
| --- | --- |
| Nama sumber | Nama unik sumber sinkronisasi. |
| Aktif | Mengizinkan sinkronisasi LDAP manual dan terjadwal. |
| Autentikator LDAP | Autentikator yang koneksi dan pemetaan atributnya digunakan kembali. |
| Filter sinkronisasi | Filter LDAP untuk pengguna. Default: `(&(objectCategory=person)(objectClass=user))`. |
| Batas jumlah | Jumlah maksimum entri per pencarian; kosong memakai batas server. |
| Ukuran halaman | Ukuran halaman pencarian LDAP bertahap. |
| Sinkronkan departemen | Menyinkronkan hierarki LDAP sebagai departemen NocoBase. |
| DN pencarian departemen | Wajib jika departemen diaktifkan, misalnya `ou=departments,dc=example,dc=com`. |

:::info
Sumber memakai Bind DN dan password autentikator yang dipilih serta tidak menyimpan salinan kredensial kedua.
:::

## Menyinkronkan pengguna

Simpan dan aktifkan sumber, lalu klik **Sinkronkan**. Buka **Tugas** untuk melihat hasil dan mencoba ulang tugas yang gagal.

Pencocokan pengguna mengikuti **Gunakan field ini untuk mengikat pengguna** pada autentikator. Pertahankan pengaturan dan pemetaan setelah sinkronisasi pertama untuk mencegah duplikasi.

## Menyinkronkan departemen

Aktifkan **Sinkronkan departemen** dan isi **DN pencarian departemen**. Plugin mencari unit organisasi, mempertahankan hierarki, dan menghubungkan pengguna ke departemen berdasarkan Distinguished Name.

## Field yang disinkronkan

### Field pengguna

| Atribut atau pengaturan LDAP | Field atau kegunaan NocoBase |
| --- | --- |
| Atribut akun login | Pengenal unik sumber dan username atau email yang dipilih sebagai field pengikat. Biasanya disimpulkan dari `{{account}}` pada filter, misalnya `uid`, `sAMAccountName`, atau `mail`. Pengguna dilewati jika atribut tidak ada. |
| Pemetaan ke `username` | Username. |
| Pemetaan ke `nickname` | Nama panggilan. |
| Pemetaan ke `email` | Alamat email. |
| Pemetaan ke `phone` | Nomor telepon. |
| `distinguishedName`, fallback ke DN entri | Departemen terdekat pada path DN dan ditetapkan sebagai departemen utama. |

Untuk atribut multi-nilai, hanya nilai pertama yang disinkronkan. Atribut yang tidak dipetakan tidak disinkronkan.

### Field departemen

| Atribut atau struktur LDAP | Field atau kegunaan NocoBase |
| --- | --- |
| `objectGUID` | Pengenal unik sumber. Unit organisasi tanpa atribut ini dilewati. |
| `ou`, `cn`, `name` | Nilai pertama yang tidak kosong menjadi nama departemen. |
| `distinguishedName`, fallback ke DN entri | Mengidentifikasi departemen dan induknya untuk membangun hierarki. |

Secara default sinkronisasi mencari objek `organizationalUnit` dan `container`. Beberapa keanggotaan dari `memberOf` dan penanggung jawab departemen belum disinkronkan.

## Pemecahan masalah

- Jika pengguna tidak ditemukan, periksa Search DN, scope, izin Bind DN, dan filter sinkronisasi.
- Jika hasil terpotong, atur ukuran halaman dan periksa batas server LDAP.
- Jika departemen hilang, periksa aktivasi dan cakupan DN pencarian departemen.
- Periksa detail tugas dan log untuk error koneksi, bind, dan pencarian.
