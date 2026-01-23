:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Integrasi Single Sign-On (SSO)

NocoBase menyediakan solusi Single Sign-On (SSO) yang komprehensif, mendukung berbagai protokol autentikasi utama untuk integrasi tanpa hambatan dengan sistem identitas perusahaan yang sudah ada.

## Gambaran Umum

Single Sign-On memungkinkan pengguna untuk mengakses beberapa sistem yang saling terkait namun independen dengan satu set kredensial. Pengguna hanya perlu masuk (login) sekali untuk mengakses semua aplikasi yang diotorisasi, tanpa perlu berulang kali memasukkan nama pengguna dan kata sandi. Hal ini tidak hanya meningkatkan pengalaman pengguna, tetapi juga memperkuat keamanan sistem dan efisiensi pengelolaan.

## Protokol Autentikasi yang Didukung

NocoBase mendukung protokol dan metode autentikasi berikut melalui **plugin**:

### Protokol SSO Tingkat Perusahaan

- **[SAML 2.0](/auth-verification/auth-saml/)**: Standar terbuka berbasis XML yang banyak digunakan untuk autentikasi identitas tingkat perusahaan. Cocok untuk skenario yang memerlukan integrasi dengan Penyedia Identitas (IdP) perusahaan.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Lapisan autentikasi modern yang dibangun di atas OAuth 2.0, menyediakan mekanisme autentikasi dan otorisasi. Mendukung integrasi dengan penyedia identitas utama (seperti Google, Azure AD, dll.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Protokol SSO yang dikembangkan oleh Yale University, banyak digunakan di institusi pendidikan tinggi dan lembaga pendidikan.

- **[LDAP](/auth-verification/auth-ldap/)**: Protokol Akses Direktori Ringan (Lightweight Directory Access Protocol) untuk mengakses dan memelihara layanan informasi direktori terdistribusi. Cocok untuk skenario yang memerlukan integrasi dengan Active Directory atau server LDAP lainnya.

### Autentikasi Platform Pihak Ketiga

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Mendukung login kode QR WeCom dan autentikasi tanpa hambatan di dalam aplikasi WeCom.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Mendukung login kode QR DingTalk dan autentikasi tanpa hambatan di dalam aplikasi DingTalk.

### Metode Autentikasi Lainnya

- **[Verifikasi SMS](/auth-verification/auth-sms/)**: Autentikasi kode verifikasi berbasis SMS ponsel.

- **[Nama Pengguna/Kata Sandi](/auth-verification/auth/)**: Metode autentikasi dasar bawaan NocoBase.

## Langkah-langkah Integrasi

### 1. Instal Plugin Autentikasi

Berdasarkan kebutuhan Anda, temukan dan instal **plugin** autentikasi yang sesuai dari manajer **plugin**. Sebagian besar **plugin** autentikasi SSO memerlukan pembelian atau langganan terpisah.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Misalnya, instal **plugin** autentikasi SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Atau instal **plugin** autentikasi OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Konfigurasi Metode Autentikasi

1. Buka halaman **Pengaturan Sistem > Autentikasi Pengguna**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Klik **Tambah Metode Autentikasi**
3. Pilih jenis autentikasi yang sudah terinstal (misalnya SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Atau pilih OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Konfigurasi parameter yang diperlukan sesuai petunjuk

### 3. Konfigurasi Penyedia Identitas

Setiap protokol autentikasi memerlukan konfigurasi Penyedia Identitas yang spesifik:

- **SAML**: Konfigurasi metadata IdP, sertifikat, dll.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Konfigurasi Client ID, Client Secret, titik akhir penemuan (discovery endpoint), dll.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Konfigurasi alamat server CAS
- **LDAP**: Konfigurasi alamat server LDAP, Bind DN, dll.
- **WeCom/DingTalk**: Konfigurasi kredensial aplikasi, Corp ID, dll.

### 4. Uji Coba Login

Setelah konfigurasi selesai, disarankan untuk melakukan uji coba terlebih dahulu:

1. Keluar dari sesi saat ini
2. Pilih metode SSO yang telah dikonfigurasi pada halaman login

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Selesaikan alur autentikasi Penyedia Identitas
4. Verifikasi apakah Anda berhasil login ke NocoBase

## Pemetaan Pengguna dan Penugasan Peran

Setelah autentikasi SSO berhasil, NocoBase akan secara otomatis menangani akun pengguna:

- **Login Pertama**: Secara otomatis membuat akun pengguna baru dan menyinkronkan informasi dasar (nama panggilan, email, dll.) dari Penyedia Identitas.
- **Login Selanjutnya**: Menggunakan akun yang sudah ada; secara opsional dapat menyinkronkan pembaruan informasi pengguna.
- **Penugasan Peran**: Dapat mengonfigurasi peran default, atau secara otomatis menetapkan peran berdasarkan atribut pengguna dari Penyedia Identitas.

## Rekomendasi Keamanan

1.  **Gunakan HTTPS**: Pastikan NocoBase di-deploy dalam lingkungan HTTPS untuk melindungi transmisi data autentikasi.
2.  **Pembaruan Sertifikat Berkala**: Segera perbarui dan rotasi kredensial keamanan seperti sertifikat SAML.
3.  **Konfigurasi Daftar Putih URL Callback**: Konfigurasi URL callback NocoBase dengan benar di Penyedia Identitas.
4.  **Prinsip Hak Akses Minimal**: Tetapkan peran dan izin yang sesuai untuk pengguna SSO.
5.  **Aktifkan Pencatatan Audit**: Catat dan pantau aktivitas login SSO.

## Pertanyaan Umum

### Login SSO Gagal?

1.  Verifikasi apakah konfigurasi Penyedia Identitas sudah benar.
2.  Pastikan URL callback telah dikonfigurasi dengan benar.
3.  Periksa log NocoBase untuk mendapatkan pesan kesalahan yang lebih detail.
4.  Konfirmasi apakah sertifikat dan kunci valid.

### Informasi Pengguna Tidak Tersinkronisasi?

1.  Periksa atribut pengguna yang dikembalikan oleh Penyedia Identitas.
2.  Verifikasi apakah konfigurasi pemetaan bidang sudah benar.
3.  Konfirmasi apakah opsi sinkronisasi informasi pengguna telah diaktifkan.

### Bagaimana Cara Mendukung Berbagai Metode Autentikasi Secara Bersamaan?

NocoBase mendukung konfigurasi berbagai metode autentikasi secara bersamaan. Pengguna dapat memilih metode yang sesuai pada halaman login.

## Sumber Daya Terkait

- [Dokumentasi Autentikasi Pengguna](/auth-verification/auth/)
- [Autentikasi Kunci API](/integration/api-keys/)
- [Manajemen Pengguna dan Izin](/plugins/@nocobase/plugin-users/)