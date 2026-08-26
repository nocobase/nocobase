---
title: "Ikhtisar Integrasi NocoBase"
description: "Kemampuan integrasi NocoBase: API Key dan dokumentasi, SSO Single Sign-On, Workflow Webhook/HTTP Request, sumber data eksternal FDW, embed Iframe, integrasi sistem perusahaan dan layanan pihak ketiga."
keywords: "integrasi,integrasi API,Webhook,FDW,SSO,single sign-on,integrasi workflow,sumber data eksternal,NocoBase"
---

# Integrasi

## Ikhtisar

NocoBase menyediakan kemampuan integrasi yang komprehensif, memungkinkan koneksi yang mulus dengan sistem eksternal, layanan pihak ketiga, dan berbagai sumber data. Melalui metode integrasi yang fleksibel, Anda dapat memperluas fungsi NocoBase untuk memenuhi kebutuhan bisnis yang beragam.

## Metode Integrasi

### Integrasi API

NocoBase menyediakan kemampuan API yang kuat untuk integrasi dengan aplikasi dan layanan eksternal:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API Key](/integration/api-keys/index.md)**: gunakan API Key untuk autentikasi yang aman, akses sumber daya NocoBase secara terprogram
- **[Dokumentasi API](/integration/api-doc/index.md)**: dokumentasi API bawaan untuk eksplorasi dan pengujian endpoint

### Single Sign-On (SSO)

Integrasikan dengan sistem identitas perusahaan untuk autentikasi terpadu:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integrasi SSO](/integration/sso/index.md)**: mendukung autentikasi SAML, OIDC, CAS, LDAP, dan platform pihak ketiga
- Manajemen pengguna dan kontrol akses terpusat
- Pengalaman autentikasi yang mulus lintas sistem

### Integrasi Workflow

Hubungkan Workflow NocoBase dengan sistem eksternal:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook Workflow](/integration/workflow-webhook/index.md)**: terima event dari sistem eksternal untuk memicu Workflow
- **[HTTP Request Workflow](/integration/workflow-http-request/index.md)**: kirim HTTP Request ke API eksternal dari Workflow
- Otomatisasi proses bisnis lintas platform

### Sumber Data Eksternal

Hubungkan ke database dan sistem data eksternal:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Database Eksternal](/data-sources/index.md)**: hubungkan langsung ke database MySQL, PostgreSQL, MariaDB, MSSQL, Oracle, dan KingbaseES
- Kenali struktur tabel database eksternal, lakukan operasi CRUD pada data eksternal langsung di NocoBase
- Antarmuka manajemen data terpadu

### Konten Tertanam

Tanam konten eksternal pada NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Blok Iframe](/integration/block-iframe/index.md)**: tanam halaman web dan aplikasi eksternal
- **JS Block**: jalankan kode JavaScript kustom untuk integrasi lanjutan

## Skenario Integrasi Umum

### Integrasi Sistem Perusahaan

- Hubungkan NocoBase dengan ERP, CRM, atau sistem perusahaan lainnya
- Sinkronisasi data dua arah
- Otomatisasi Workflow lintas sistem

### Integrasi Layanan Pihak Ketiga

- Periksa status pembayaran gateway pembayaran, integrasikan layanan pesan atau platform cloud
- Manfaatkan API eksternal untuk memperluas fungsionalitas
- Bangun integrasi kustom dengan webhook dan HTTP Request

### Integrasi Data

- Hubungkan ke beberapa sumber data
- Agregasikan data dari berbagai sistem
- Buat dashboard dan laporan terpadu

## Pertimbangan Keamanan

Saat mengintegrasikan NocoBase dengan sistem eksternal, pertimbangkan praktik terbaik keamanan berikut:

1. **Gunakan HTTPS**: selalu gunakan koneksi terenkripsi untuk transmisi data
2. **Lindungi API Key**: simpan API Key dengan aman dan rotasikan secara berkala
3. **Prinsip hak akses minimum**: berikan hanya izin yang diperlukan untuk integrasi
4. **Log audit**: pantau dan catat aktivitas integrasi
5. **Validasi data**: validasi semua data dari sumber eksternal
