---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Autentikasi Dua Faktor (2FA)

## Pendahuluan

Autentikasi Dua Faktor (2FA) adalah langkah keamanan tambahan yang digunakan saat login ke aplikasi. Ketika 2FA diaktifkan, pengguna diwajibkan untuk menyediakan bentuk autentikasi lain—seperti kode OTP, TOTP, dan lain-lain—selain kata sandi mereka.

:::info{title=Catatan}
Saat ini, proses 2FA hanya berlaku untuk login berbasis kata sandi. Jika aplikasi Anda telah mengaktifkan SSO atau metode autentikasi lainnya, harap gunakan perlindungan autentikasi multifaktor (MFA) yang disediakan oleh IdP terkait.
:::

## Mengaktifkan Plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Konfigurasi Administrator

Setelah mengaktifkan plugin, halaman konfigurasi 2FA akan ditambahkan ke halaman manajemen autentikator.

Administrator perlu mencentang opsi "Terapkan autentikasi dua faktor (2FA) untuk semua pengguna" dan memilih jenis autentikator yang tersedia untuk diikat. Jika tidak ada autentikator yang tersedia, harap buat autentikator baru terlebih dahulu di halaman manajemen verifikasi. Lihat: [Verifikasi](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Login Pengguna

Setelah 2FA diaktifkan di aplikasi, saat pengguna login menggunakan kata sandi, mereka akan masuk ke proses verifikasi 2FA.

Jika pengguna belum mengikat autentikator yang ditentukan, mereka akan diminta untuk mengikatnya. Setelah pengikatan berhasil, mereka dapat mengakses aplikasi.

![](https://static-docs.nocobase.com/202502282110829.png)

Jika pengguna telah mengikat salah satu autentikator yang ditentukan, mereka akan diminta untuk memverifikasi identitas mereka menggunakan autentikator yang telah diikat. Setelah verifikasi berhasil, mereka dapat mengakses aplikasi.

![](https://static-docs.nocobase.com/202502282110148.png)

Setelah login berhasil, pengguna dapat mengikat autentikator tambahan di halaman manajemen verifikasi di pusat pribadi mereka.

![](https://static-docs.nocobase.com/202502282110024.png)