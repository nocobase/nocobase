---
title: "Integrasi Single Sign-On (SSO)"
description: "Integrasi SSO NocoBase: autentikasi SAML, OIDC, CAS, LDAP, WeCom, DingTalk, konfigurasi penyedia identitas, pemetaan pengguna, penetapan peran, saran keamanan."
keywords: "SSO,single sign-on,SAML,OIDC,CAS,LDAP,WeCom,DingTalk,autentikasi terpadu,NocoBase"
---

# Integrasi Single Sign-On (SSO)

NocoBase menyediakan solusi Single Sign-On (SSO) yang lengkap, mendukung berbagai protokol autentikasi utama dan dapat diintegrasikan dengan mulus dengan sistem autentikasi identitas perusahaan yang ada.

## Ikhtisar

Single sign-on memungkinkan pengguna untuk login ke beberapa sistem yang terkait tetapi independen menggunakan satu set kredensial. Pengguna hanya perlu login sekali untuk mengakses semua aplikasi yang diizinkan, tanpa perlu memasukkan ulang nama pengguna dan kata sandi. Ini tidak hanya meningkatkan pengalaman pengguna, tetapi juga meningkatkan keamanan sistem dan efisiensi manajemen.

## Protokol Autentikasi yang Didukung

NocoBase mendukung protokol autentikasi dan metode berikut melalui Plugin:

### Protokol SSO Tingkat Perusahaan

- **[SAML 2.0](/auth-verification/auth-saml/index.md)**: standar terbuka berbasis XML yang banyak digunakan dalam autentikasi identitas tingkat perusahaan. Cocok untuk skenario yang perlu integrasi dengan Identity Provider (IdP) perusahaan.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/index.md)**: lapisan autentikasi identitas berbasis OAuth 2.0, menyediakan mekanisme autentikasi dan otorisasi modern. Mendukung integrasi dengan penyedia identitas utama (seperti Google, Azure AD, dll.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/index.md)**: protokol single sign-on yang dikembangkan oleh Yale University, banyak digunakan di universitas dan institusi pendidikan.

- **[LDAP](/auth-verification/auth-ldap/index.md)**: Lightweight Directory Access Protocol, digunakan untuk mengakses dan memelihara layanan informasi direktori terdistribusi. Cocok untuk skenario yang perlu integrasi dengan Active Directory atau server LDAP lainnya.

### Autentikasi Platform Pihak Ketiga

- **[WeCom](/auth-verification/auth-wecom/index.md)**: mendukung login QR code WeCom dan login bebas dalam WeCom.

- **[DingTalk](/auth-verification/auth-dingtalk/index.md)**: mendukung login QR code DingTalk dan login bebas dalam DingTalk.

### Metode Autentikasi Lainnya

- **[Kode Verifikasi SMS](/auth-verification/auth-sms/index.md)**: metode login kode verifikasi berbasis SMS handphone.

- **[Username dan Password](/auth-verification/auth/index.md)**: metode autentikasi dasar bawaan NocoBase.

## Langkah Integrasi

### 1. Instal Plugin Autentikasi

Sesuai kebutuhan Anda, temukan dan instal Plugin autentikasi yang sesuai pada plugin manager. Sebagian besar Plugin autentikasi SSO perlu dibeli atau dilanggan secara terpisah.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Misalnya, instal Plugin Autentikasi SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Atau instal Plugin Autentikasi OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Konfigurasikan Metode Autentikasi

1. Masuk ke halaman **Pengaturan Sistem > Autentikasi Pengguna**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Klik **Tambahkan Metode Autentikasi**
3. Pilih tipe autentikasi yang sudah diinstal (misalnya SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Atau pilih OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Konfigurasikan parameter terkait sesuai prompt

### 3. Konfigurasikan Penyedia Identitas

Setiap protokol autentikasi memerlukan konfigurasi informasi penyedia identitas yang sesuai:

- **SAML**: konfigurasi metadata IdP, sertifikat, dll.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: konfigurasi Client ID, Client Secret, discovery endpoint, dll.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: konfigurasi alamat server CAS
- **LDAP**: konfigurasi alamat server LDAP, binding DN, dll.
- **WeCom/DingTalk**: konfigurasi kredensial aplikasi, Corp ID, dll.

### 4. Pengujian Login

Setelah konfigurasi selesai, disarankan untuk melakukan pengujian terlebih dahulu:

1. Logout dari sesi saat ini
2. Pilih metode SSO yang dikonfigurasi pada halaman login

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Selesaikan alur autentikasi penyedia identitas
4. Validasi apakah berhasil login ke NocoBase

## Pemetaan Pengguna dan Penetapan Peran

Setelah autentikasi SSO berhasil, NocoBase akan menangani akun pengguna secara otomatis:

- **Login pertama**: secara otomatis membuat akun pengguna baru dan sinkronisasi informasi dasar (nickname, email, dll.) dari penyedia identitas
- **Login berikutnya**: gunakan akun yang ada untuk login, dapat dipilih apakah akan sinkronisasi update informasi pengguna
- **Penetapan peran**: dapat mengkonfigurasi peran default, atau menetapkan peran secara otomatis melalui field peran pada informasi pengguna

## Saran Keamanan

1. **Gunakan HTTPS**: pastikan NocoBase di-deploy di lingkungan HTTPS untuk melindungi keamanan transmisi data autentikasi
2. **Update sertifikat secara berkala**: update dan rotasikan sertifikat SAML dan kredensial keamanan lainnya tepat waktu
3. **Konfigurasikan whitelist alamat callback**: konfigurasikan alamat callback NocoBase dengan benar pada penyedia identitas
4. **Prinsip hak akses minimum**: tetapkan peran dan izin yang sesuai untuk pengguna SSO
5. **Aktifkan log audit**: catat dan pantau perilaku login SSO

## Pertanyaan Umum

### Login SSO gagal?

1. Periksa apakah konfigurasi penyedia identitas benar
2. Validasi apakah alamat callback dikonfigurasi dengan benar
3. Lihat log NocoBase untuk informasi error rinci
4. Konfirmasikan apakah sertifikat dan kunci masih valid

### Informasi pengguna tidak tersinkronisasi?

1. Periksa atribut pengguna yang dikembalikan oleh penyedia identitas
2. Validasi apakah konfigurasi pemetaan field benar
3. Konfirmasikan apakah opsi sinkronisasi informasi pengguna diaktifkan

### Bagaimana cara mendukung beberapa metode autentikasi sekaligus?

NocoBase mendukung konfigurasi beberapa metode autentikasi sekaligus; pengguna dapat memilih metode yang sesuai untuk login pada halaman login.

## Sumber Daya Terkait

- [Dokumentasi Autentikasi Pengguna](/auth-verification/auth/index.md)
- [Autentikasi API Key](/integration/api-keys/index.md)
- [Manajemen Pengguna dan Izin](/plugins/@nocobase/plugin-users/index.md)
