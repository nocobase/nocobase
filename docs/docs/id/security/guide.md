---
title: "Panduan Keamanan NocoBase"
description: "Panduan Keamanan NocoBase: autentikasi user, kebijakan JWT Token, APP_KEY, kontrol akses, enkripsi data, pembatasan IP, kebijakan password, audit log, penyimpanan LocalStorage/SessionStorage."
keywords: "keamanan NocoBase,autentikasi user,kebijakan Token,kontrol akses,enkripsi data,pembatasan IP,kebijakan password,audit log,NocoBase"
---

# Panduan Keamanan NocoBase

NocoBase mementingkan keamanan data dan aplikasi mulai dari desain fitur hingga implementasi sistem. Platform memiliki banyak fitur keamanan built-in seperti autentikasi user, kontrol akses, enkripsi data, dan memungkinkan konfigurasi kebijakan keamanan yang fleksibel sesuai kebutuhan nyata. Baik untuk melindungi data user, mengelola hak akses, atau mengisolasi environment development dan production, NocoBase menyediakan tool dan solusi praktis. Panduan ini bertujuan memberikan panduan untuk menggunakan NocoBase secara aman, membantu user melindungi keamanan data, aplikasi, dan environment, sambil memastikan user dapat menggunakan fitur sistem secara efisien dengan aman.

## Autentikasi User

Autentikasi user digunakan untuk mengidentifikasi identitas user, mencegah user memasuki sistem tanpa otorisasi, dan memastikan identitas user tidak disalahgunakan.

### Token Secret Key

Secara default, NocoBase menggunakan JWT (JSON Web Token) untuk autentikasi API server. Anda dapat mengatur secret key Token melalui environment variable `APP_KEY`. Harap kelola Token secret key aplikasi dengan baik dan cegah kebocoran. Perlu diperhatikan bahwa jika `APP_KEY` dimodifikasi, Token lama juga akan menjadi tidak valid.

### Kebijakan Token

NocoBase mendukung pengaturan kebijakan keamanan berikut untuk Token user:

| Item Konfigurasi          | Penjelasan                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masa berlaku sesi         | Waktu efektif maksimum setiap kali user login. Dalam masa berlaku sesi, Token akan diperbarui otomatis. Setelah timeout, user diminta login ulang.                                          |
| Masa berlaku Token        | Masa berlaku setiap API Token yang dikeluarkan. Setelah Token expired, jika masih dalam masa berlaku sesi dan tidak melebihi batas refresh, server akan otomatis mengeluarkan Token baru untuk menjaga sesi user, jika tidak user diminta login ulang. (Setiap Token hanya dapat di-refresh sekali) |
| Batas refresh Token expired | Batas waktu maksimum untuk refresh setelah Token expired                                                                                                                                  |

Biasanya, kami merekomendasikan administrator:

- Atur masa berlaku Token yang lebih singkat untuk membatasi waktu paparan Token.
- Atur masa berlaku sesi yang wajar, lebih panjang dari masa berlaku Token tetapi tidak terlalu panjang, untuk menyeimbangkan pengalaman user dan keamanan. Manfaatkan mekanisme auto-refresh Token untuk memastikan sesi user aktif tidak terputus, sekaligus mengurangi risiko penyalahgunaan sesi jangka panjang.
- Atur batas refresh Token expired yang wajar, sehingga saat user tidak aktif dalam waktu lama, Token akan expired secara alami tanpa mengeluarkan Token baru, mengurangi risiko penyalahgunaan sesi user yang idle.

### Penyimpanan Token Client

Secara default, Token user disimpan di LocalStorage browser. Setelah menutup halaman browser dan membukanya kembali, jika Token masih dalam masa berlaku, user tidak perlu login ulang.

Jika Anda ingin user login ulang setiap kali memasuki halaman, Anda dapat mengatur environment variable `API_CLIENT_STORAGE_TYPE=sessionStorage`, untuk menyimpan Token user di SessionStorage browser, sehingga user perlu login ulang setiap kali membuka halaman.

### Kebijakan Password

> Versi Pro dan ke atas

NocoBase mendukung pengaturan aturan password dan kebijakan penguncian percobaan login password untuk semua user, untuk meningkatkan keamanan aplikasi NocoBase yang mengaktifkan login password. Anda dapat merujuk ke [Kebijakan Password](./password-policy/index.md) untuk memahami setiap item konfigurasi.

#### Aturan Password

| Item Konfigurasi               | Penjelasan                                                  |
| ------------------------------ | ----------------------------------------------------------- |
| **Panjang password**           | Persyaratan panjang minimum password, panjang maksimum 64.   |
| **Kompleksitas password**      | Atur persyaratan kompleksitas password, tipe karakter yang harus disertakan. |
| **Tidak boleh berisi username dalam password** | Atur apakah password boleh berisi username user saat ini.     |
| **Ingat history password**     | Ingat jumlah password yang baru-baru ini digunakan user, user tidak boleh mengulanginya saat mengubah password. |

#### Konfigurasi Password Expired

| Item Konfigurasi                  | Penjelasan                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Masa berlaku password**         | Masa berlaku password user. User harus mengganti password sebelum expired, baru masa berlaku akan dihitung ulang. Jika tidak mengganti password sebelum expired, password lama tidak dapat digunakan untuk login, perlu bantuan admin untuk reset.<br>Jika ada metode login lain yang dikonfigurasi, user dapat menggunakan metode lain untuk login. |
| **Channel notifikasi pengingat password expired** | Dalam 10 hari sebelum password user expired, kirim pengingat setiap kali user login.                                                                                                              |

#### Keamanan Login Password

| Item Konfigurasi                                | Penjelasan                                                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Jumlah maksimum percobaan login password tidak valid** | Atur jumlah maksimum user dapat mencoba login dalam interval waktu yang ditentukan.                                                       |
| **Interval waktu maksimum login password tidak valid (detik)** | Atur interval waktu untuk menghitung jumlah maksimum login tidak valid user, satuannya detik.                                            |
| **Waktu lockout (detik)**                       | Atur waktu lockout user setelah melebihi batas login password tidak valid (0 berarti tidak terbatas).<br>Selama user di-lockout, user tidak dapat mengakses sistem dengan metode autentikasi apa pun, termasuk API keys. |

Biasanya, kami merekomendasikan:

- Atur aturan password dengan kekuatan yang lebih tinggi untuk mengurangi risiko password ditebak melalui asosiasi atau brute force.
- Atur masa berlaku password yang wajar, untuk memaksa user mengganti password secara berkala.
- Kombinasikan konfigurasi jumlah dan waktu login password tidak valid, untuk membatasi percobaan login password frekuensi tinggi dalam waktu singkat, mencegah brute force password.
- Pada skenario dengan persyaratan keamanan yang lebih ketat, dapat mengatur waktu lockout user yang wajar setelah melebihi batas login. Tetapi perlu diperhatikan bahwa pengaturan waktu lockout dapat dieksploitasi secara malicious. Penyerang dapat sengaja memasukkan password salah berkali-kali untuk akun target, memaksa akun di-lockout dan tidak dapat digunakan secara normal. Dalam penggunaan nyata, dapat mengkombinasikan dengan pembatasan IP, rate limiting API, dll untuk mencegah serangan jenis ini.
- Modifikasi default username, email, password root NocoBase, untuk menghindari eksploitasi malicious.
- Karena password expired atau akun di-lockout akan menyebabkan tidak dapat masuk sistem, termasuk akun admin, disarankan untuk mengatur beberapa akun yang memiliki hak untuk reset password dan unlock user di sistem.

![](https://static-docs.nocobase.com/202501031618900.png)

### Penguncian User

> Versi Pro dan ke atas, termasuk dalam plugin password policy

Mengelola user yang di-lockout karena melebihi batas login password tidak valid. Anda dapat unlock secara aktif, atau menambahkan user yang abnormal ke daftar lockout secara aktif. Setelah user di-lockout, user tidak dapat mengakses sistem dengan metode autentikasi apa pun, termasuk API keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### API Key

NocoBase mendukung pemanggilan API sistem melalui API key. User dapat menambahkan API key di konfigurasi plugin API key.

- Harap binding role yang benar untuk API key, dan pastikan permission yang terkait dengan role dikonfigurasi dengan benar.
- Saat menggunakan API key, cegah API key bocor.
- Biasanya, kami merekomendasikan user untuk mengatur masa berlaku untuk API key, jangan gunakan opsi "tidak pernah expired".
- Jika API key terdeteksi digunakan secara abnormal dan mungkin ada risiko kebocoran, user dapat menghapus API key tersebut untuk membuatnya tidak valid.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Single Sign-On

> Plugin commercial

NocoBase menyediakan banyak plugin autentikasi SSO, mendukung berbagai protokol mainstream seperti OIDC, SAML 2.0, LDAP, CAS. Sekaligus, NocoBase juga memiliki interface ekstensi metode autentikasi yang lengkap, dapat mendukung pengembangan dan integrasi cepat untuk tipe autentikasi lain. Dapat dengan mudah mengintegrasikan IdP yang sudah ada dengan NocoBase, mengelola identitas user secara terpusat di IdP, meningkatkan keamanan.
![](https://static-docs.nocobase.com/202501031619427.png)

### Two-Factor Authentication

> Versi Enterprise

Two-factor authentication mengharuskan user memberikan informasi efektif kedua untuk membuktikan identitas saat login menggunakan password, misalnya dengan mengirim one-time dynamic verification code ke perangkat tepercaya user, untuk memverifikasi identitas user, memastikan identitas user tidak disalahgunakan, mengurangi risiko yang ditimbulkan dari kebocoran password.

### Kontrol Akses IP

> Versi Enterprise

NocoBase mendukung pengaturan blacklist atau whitelist untuk IP akses user.

- Pada environment dengan persyaratan keamanan yang ketat, Anda dapat mengatur whitelist IP, hanya mengizinkan IP atau IP segment tertentu untuk mengakses sistem, untuk membatasi koneksi jaringan eksternal yang tidak terotorisasi, mengurangi risiko keamanan dari sumber.
- Pada kondisi akses jaringan publik, jika admin menemukan akses abnormal, Anda dapat mengatur blacklist IP, untuk memblokir alamat IP malicious yang diketahui, atau akses dari sumber mencurigakan, mengurangi ancaman keamanan seperti malicious scanning, brute force, dll.
- Untuk request akses yang ditolak, log akan disimpan.

## Kontrol Permission

Dengan mengatur role yang berbeda di sistem, dan mengatur permission yang sesuai untuk role, Anda dapat mengontrol akses user terhadap resource secara granular. Admin perlu mengkombinasikan dengan kebutuhan skenario nyata, melakukan konfigurasi yang wajar, untuk mengurangi risiko kebocoran resource sistem.

### User Root

Saat instalasi NocoBase pertama kali, aplikasi akan menginisialisasi user root. Disarankan user mengatur environment variable sistem untuk memodifikasi informasi terkait user root, untuk menghindari eksploitasi malicious.

- `INIT_ROOT_USERNAME` - username root
- `INIT_ROOT_EMAIL` - email root
- `INIT_ROOT_PASSWORD` - password root, harap atur password dengan kekuatan tinggi.

Dalam penggunaan sistem selanjutnya, disarankan user mengatur dan menggunakan akun admin lain, sebisa mungkin hindari menggunakan user root langsung untuk mengoperasikan aplikasi.

### Role dan Permission

NocoBase mengontrol akses user terhadap resource dengan mengatur role di sistem, mengotorisasi role yang berbeda, dan binding user ke role yang sesuai. Setiap user dapat memiliki beberapa role, user dapat berganti role untuk mengoperasikan resource dari perspektif yang berbeda. Jika plugin departemen diinstal, role juga dapat di-binding dengan departemen, sehingga user dapat memiliki role yang di-binding ke departemennya.

![](https://static-docs.nocobase.com/202501031620965.png)

### Permission Konfigurasi Sistem

Permission konfigurasi sistem mencakup pengaturan berikut:

- Apakah mengizinkan interface konfigurasi
- Apakah mengizinkan instal, aktifkan, nonaktifkan plugin
- Apakah mengizinkan konfigurasi plugin
- Apakah mengizinkan clear cache, restart aplikasi
- Permission konfigurasi setiap plugin

### Permission Menu

Permission menu digunakan untuk mengontrol permission user untuk memasuki halaman menu yang berbeda, termasuk desktop dan mobile.
![](https://static-docs.nocobase.com/202501031620717.png)

### Permission Data

NocoBase menyediakan kontrol granular atas permission akses data user dalam sistem, memastikan user yang berbeda hanya dapat mengakses data terkait dengan tanggung jawabnya, mencegah akses berlebih dan kebocoran data.

#### Kontrol Global

![](https://static-docs.nocobase.com/202501031620866.png)

#### Kontrol Tabel-Level, Field-Level

![](https://static-docs.nocobase.com/202501031621047.png)

#### Kontrol Range Data

Atur range data yang dapat dioperasikan user. Perlu diperhatikan bahwa range data di sini berbeda dengan range data yang dikonfigurasi di Block. Range data yang dikonfigurasi di Block biasanya hanya digunakan untuk filter data frontend. Jika Anda perlu mengontrol secara ketat permission akses user terhadap resource data, perlu dikonfigurasi di sini, dikontrol oleh server.

![](https://static-docs.nocobase.com/202501031621712.png)

## Keamanan Data

Dalam proses penyimpanan dan backup data, NocoBase menyediakan mekanisme efektif untuk memastikan keamanan data.

### Penyimpanan Password

Password user NocoBase dienkripsi dan disimpan menggunakan algoritma scrypt, yang dapat secara efektif melawan serangan hardware skala besar.

### Variabel Environment dan Secret

Saat menggunakan layanan pihak ketiga di NocoBase, kami merekomendasikan Anda untuk mengonfigurasi informasi secret pihak ketiga ke environment variable, dan menyimpan secara terenkripsi. Cara ini memudahkan konfigurasi dan penggunaan di tempat yang berbeda, sekaligus meningkatkan keamanan. Anda dapat melihat dokumentasi untuk memahami metode penggunaan detailnya.

:::warning
Secara default, secret dienkripsi menggunakan algoritma AES-256-CBC. NocoBase akan secara otomatis menghasilkan kunci enkripsi 32-bit dan menyimpannya di storage/.data/environment/aes_key.dat. User harus menyimpan file kunci dengan baik, untuk mencegah file kunci dicuri. Jika perlu memigrasikan data, file kunci perlu dimigrasikan bersama.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### File Storage

Jika perlu menyimpan file sensitif, disarankan menggunakan layanan cloud storage yang kompatibel dengan protokol S3, dan menggabungkannya dengan plugin commercial File storage: S3 (Pro), untuk mengimplementasikan baca/tulis privat file. Jika perlu digunakan di environment intranet, disarankan menggunakan aplikasi storage yang mendukung deployment privat dan kompatibel dengan protokol S3 seperti MinIO.

![](https://static-docs.nocobase.com/202501031623549.png)

### Backup Aplikasi

Untuk memastikan keamanan data aplikasi dan menghindari kehilangan data, kami merekomendasikan Anda untuk membackup database secara berkala.

User versi open-source dapat merujuk ke https://www.nocobase.com/en/blog/nocobase-backup-restore untuk menggunakan tool database untuk backup. Sekaligus kami merekomendasikan Anda menyimpan file backup dengan baik untuk mencegah kebocoran data.

User versi Pro dan ke atas dapat menggunakan Backup Manager untuk backup. Backup Manager menyediakan fitur berikut:

- Backup otomatis terjadwal: backup otomatis berkala, menghemat waktu dan operasi manual, keamanan data lebih terjamin.
- Sinkronisasi file backup ke cloud storage: mengisolasi file backup dari layanan aplikasi itu sendiri, mencegah file backup hilang saat layanan tidak tersedia karena server failure.
- Enkripsi file backup: atur password untuk file backup, untuk mengurangi risiko kebocoran data akibat kebocoran file backup.

![](https://static-docs.nocobase.com/202501031623107.png)

## Keamanan Runtime Environment

Mendeploy NocoBase dengan benar dan menjamin keamanan runtime environment, adalah salah satu kunci untuk memastikan keamanan aplikasi NocoBase.

### Deployment HTTPS

Untuk mencegah man-in-the-middle attack, kami merekomendasikan Anda menambahkan sertifikat SSL/TLS ke website aplikasi NocoBase, untuk memastikan keamanan data dalam transmisi jaringan.

### Enkripsi Transmisi API

> Versi Enterprise

Pada environment dengan persyaratan keamanan data yang lebih ketat, NocoBase mendukung pengaktifan enkripsi transmisi API, untuk mengenkripsi konten request dan response API, menghindari transmisi plaintext, meningkatkan ambang batas pemecahan data.

### Deployment Privat

Secara default, NocoBase tidak perlu berkomunikasi dengan layanan pihak ketiga. Tim NocoBase tidak akan mengumpulkan informasi apa pun dari user. Hanya saat melakukan dua operasi berikut perlu terhubung ke server NocoBase:

1. Download otomatis plugin commercial melalui platform NocoBase Service.
2. Verifikasi dan aktivasi online aplikasi versi commercial.

Jika Anda bersedia mengorbankan sedikit kenyamanan, kedua operasi ini juga mendukung penyelesaian offline, tidak perlu terhubung langsung ke server NocoBase.

NocoBase mendukung deployment intranet penuh, lihat

- https://www.nocobase.com/en/blog/load-docker-image

### Isolasi Multi-Environment

> Versi Pro dan ke atas

Dalam praktik penggunaan nyata, kami merekomendasikan user enterprise untuk mengisolasi environment testing dan production, untuk memastikan keamanan data dan runtime environment aplikasi pada environment production. Manfaatkan plugin manajemen migrasi, dapat mengimplementasikan migrasi data aplikasi antar environment yang berbeda.

![](https://static-docs.nocobase.com/202501031627729.png)

## Audit dan Monitoring

### Audit Log

> Versi Enterprise

Fitur audit log NocoBase mencatat history aktivitas user dalam sistem. Dengan mencatat operasi kunci dan perilaku akses user, admin dapat:

- Memeriksa informasi seperti IP akses user, perangkat, dan waktu operasi, untuk segera menemukan perilaku abnormal.
- Melacak history operasi resource data dalam sistem.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Application Log

NocoBase menyediakan beberapa tipe log untuk membantu user memahami status running sistem dan history perilaku, untuk segera menemukan dan mendiagnosis masalah sistem, menjamin keamanan dan kontrol sistem dari berbagai dimensi. Tipe log utama meliputi:

- Request log: log request API, termasuk URL yang diakses, HTTP method, parameter request, response time dan status code, dll.
- System log: mencatat event running aplikasi, termasuk service startup, perubahan konfigurasi, informasi error, dan operasi kunci, dll.
- SQL log: mencatat statement operasi database dan waktu eksekusinya, mencakup query, update, insert, delete, dll.
- Workflow log: log eksekusi workflow, termasuk waktu eksekusi, informasi running, informasi error, dll.
