---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Autentikasi: LDAP

## Pendahuluan

Plugin Autentikasi: LDAP mengikuti standar protokol LDAP (Lightweight Directory Access Protocol), memungkinkan pengguna untuk masuk ke NocoBase menggunakan kredensial akun dari server LDAP mereka.

## Mengaktifkan plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Menambahkan Autentikasi LDAP

Buka halaman pengaturan plugin autentikasi pengguna.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Tambahkan - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Konfigurasi

### Konfigurasi Dasar

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Daftar otomatis jika pengguna tidak ada - Apakah akan secara otomatis membuat pengguna baru ketika tidak ditemukan pengguna yang cocok.
- URL LDAP - Alamat server LDAP
- Bind DN - DN yang digunakan untuk menguji koneksi server dan mencari pengguna.
- Kata sandi Bind - Kata sandi dari Bind DN.
- Uji koneksi - Klik tombol untuk menguji koneksi server dan memvalidasi Bind DN.

### Konfigurasi Pencarian

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - DN yang digunakan untuk mencari pengguna.
- Filter pencarian - Kondisi filter untuk mencari pengguna, gunakan `{{account}}` untuk merepresentasikan akun pengguna yang digunakan saat masuk.
- Cakupan - `Base`, `One level`, `Subtree`, `Subtree` sebagai nilai bawaan.
- Batas ukuran - Ukuran halaman pencarian.

### Pemetaan Atribut

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Gunakan bidang ini untuk mengikat pengguna - Bidang yang digunakan untuk mengikat ke pengguna yang sudah ada. Pilih 'nama pengguna' jika akun masuk adalah nama pengguna, atau 'email' jika itu adalah alamat email. Nilai bawaannya adalah nama pengguna.
- Peta atribut - Pemetaan atribut pengguna ke bidang dalam tabel pengguna NocoBase.

## Masuk

Kunjungi halaman masuk dan masukkan nama pengguna serta kata sandi LDAP di formulir masuk.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>