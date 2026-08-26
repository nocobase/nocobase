---
pkg: '@nocobase/plugin-auth-ldap'
title: "Autentikasi: LDAP"
description: "Autentikasi LDAP NocoBase: mengikuti protokol LDAP, login menggunakan username dan password server LDAP, mengkonfigurasi LDAP URL, Bind DN, Search DN, attribute mapping."
keywords: "LDAP,layanan direktori,autentikasi enterprise,Bind DN,Search DN,attribute mapping,NocoBase"
---

# Autentikasi: LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Pengantar

Plugin Autentikasi: LDAP mengikuti standar protokol LDAP (Lightweight Directory Access Protocol), memungkinkan pengguna login ke NocoBase menggunakan username dan password server LDAP.

## Mengaktifkan Plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Menambahkan Autentikasi LDAP

Masuk ke halaman manajemen plugin autentikasi pengguna.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Tambahkan - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Konfigurasi

### Konfigurasi Dasar

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - Apakah secara otomatis membuat pengguna baru ketika tidak ditemukan pengguna yang dapat dicocokkan dan diikat.
- LDAP URL - Alamat server LDAP
- Bind DN - DN yang digunakan untuk menguji konektivitas server dan mencari pengguna
- Bind password - Password untuk Bind DN
- Test connection - Klik tombol untuk menguji konektivitas server dan validitas Bind DN.

### Konfigurasi Pencarian

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - DN yang digunakan untuk mencari pengguna
- Search filter - Kondisi filter untuk mencari pengguna, gunakan `{{account}}` untuk merepresentasikan akun pengguna yang digunakan saat login
- Scope - `Base`, `One level`, `Subtree`, default `Subtree`
- Size limit - Ukuran paging pencarian

### Attribute Mapping

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - Field yang digunakan untuk mengikat pengguna yang sudah ada. Jika akun login adalah username, pilih username; jika email, pilih email. Default username.
- Attribute map - Pemetaan antara atribut pengguna dan field tabel pengguna NocoBase.

## Login

Akses halaman login, masukkan username dan password LDAP pada formulir login untuk login.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>
