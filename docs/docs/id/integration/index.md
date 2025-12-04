:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Integrasi

## Gambaran Umum

NocoBase menyediakan kemampuan integrasi yang komprehensif, memungkinkan koneksi tanpa hambatan dengan sistem eksternal, layanan pihak ketiga, dan berbagai sumber data. Melalui metode integrasi yang fleksibel, Anda dapat memperluas fungsionalitas NocoBase untuk memenuhi beragam kebutuhan bisnis.

## Metode Integrasi

### Integrasi API

NocoBase menyediakan kemampuan API yang tangguh untuk berintegrasi dengan aplikasi dan layanan eksternal:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Kunci API](/integration/api-keys/)**: Gunakan kunci API untuk autentikasi aman, guna mengakses sumber daya NocoBase secara terprogram.
- **[Dokumentasi API](/integration/api-doc/)**: Dokumentasi API bawaan untuk menjelajahi dan menguji *endpoint*.

### Single Sign-On (SSO)

Berintegrasi dengan sistem identitas perusahaan untuk mencapai autentikasi terpadu:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integrasi SSO](/integration/sso/)**: Mendukung autentikasi SAML, OIDC, CAS, LDAP, dan platform pihak ketiga.
- Manajemen pengguna terpusat dan kontrol akses.
- Pengalaman autentikasi tanpa hambatan di seluruh sistem.

### Integrasi Alur Kerja

Menghubungkan alur kerja NocoBase dengan sistem eksternal:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook Alur Kerja](/integration/workflow-webhook/)**: Menerima *event* dari sistem eksternal untuk memicu alur kerja.
- **[Permintaan HTTP Alur Kerja](/integration/workflow-http-request/)**: Mengirim permintaan HTTP ke API eksternal dari alur kerja.
- Mengotomatiskan proses bisnis lintas platform.

### Sumber Data Eksternal

Menghubungkan ke basis data dan sistem data eksternal:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Basis Data Eksternal](/data-sources/)**: Terhubung langsung ke basis data MySQL, PostgreSQL, MariaDB, MSSQL, Oracle, dan KingbaseES.
- Mengenali struktur tabel basis data eksternal dan melakukan operasi CRUD pada data eksternal langsung di NocoBase.
- Antarmuka manajemen data terpadu.

### Konten Tersemat

Menyematkan konten eksternal di NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Blok Iframe](/integration/block-iframe/)**: Menyematkan halaman web dan aplikasi eksternal.
- **Blok JS**: Menjalankan kode JavaScript kustom untuk integrasi tingkat lanjut.

## Skenario Integrasi Umum

### Integrasi Sistem Perusahaan

- Menghubungkan NocoBase dengan ERP, CRM, atau sistem perusahaan lainnya.
- Sinkronisasi data dua arah.
- Mengotomatiskan alur kerja lintas sistem.

### Integrasi Layanan Pihak Ketiga

- Mengajukan kueri status pembayaran dari *payment gateway*, mengintegrasikan layanan pesan, atau platform *cloud*.
- Memanfaatkan API eksternal untuk memperluas fungsionalitas.
- Membangun integrasi kustom menggunakan *webhook* dan permintaan HTTP.

### Integrasi Data

- Menghubungkan ke beberapa sumber data.
- Mengagregasi data dari sistem yang berbeda.
- Membuat *dashboard* dan laporan terpadu.

## Pertimbangan Keamanan

Saat mengintegrasikan NocoBase dengan sistem eksternal, pertimbangkan praktik terbaik keamanan berikut:

1.  **Gunakan HTTPS**: Selalu gunakan koneksi terenkripsi untuk transmisi data.
2.  **Amankan Kunci API**: Simpan kunci API dengan aman dan rotasi secara berkala.
3.  **Prinsip Hak Akses Minimal**: Berikan hanya hak akses yang diperlukan untuk integrasi.
4.  **Pencatatan Audit**: Pantau dan catat aktivitas integrasi.
5.  **Validasi Data**: Validasi semua data dari sumber eksternal.