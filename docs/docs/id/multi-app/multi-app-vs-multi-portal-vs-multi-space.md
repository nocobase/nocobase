# Multi-portal, Multi-app, dan Multi-space

NocoBase menyediakan tiga kemampuan: Multi-portal, Multi-app, dan Multi-space.

Ketiganya menyelesaikan masalah pada dimensi yang berbeda dan dapat digunakan secara terpisah maupun bersama.

## Perbedaan utama

| Kemampuan | Multi-portal | Multi-app | Multi-space |
|------|------|------|------|
| Masalah yang diselesaikan | Menyediakan beberapa pintu masuk akses | Membagi bisnis menjadi beberapa sistem | Mengisolasi data bisnis |
| Fokus utama | Dari mana pengguna masuk | Bagaimana sistem dibagi | Siapa pemilik data |
| Data | Dibagikan | Independen secara default | Terisolasi |
| Halaman dan menu | Independen | Independen | Dibagikan |
| Konfigurasi plugin | Dibagikan | Independen | Dibagikan |
| Sistem pengguna | Dibagikan | Dapat dibagikan melalui SSO | Dibagikan |
| Skenario umum | Peran yang berbeda memerlukan pintu masuk yang berbeda | Bisnis yang berbeda memerlukan pengelolaan terpisah | Banyak organisasi, toko, atau tenant |
| Dapat dikombinasikan | Ya | Ya | Ya |

## Multi-portal

Multi-portal menyediakan beberapa pintu masuk akses dalam aplikasi yang sama.

Contohnya:

```text
Aplikasi ERP

├─ Portal Admin (/v/admin)
├─ Portal Toko (/v/store)
├─ Portal Distributor (/v/dealer)
└─ Portal Mobile (/v/mobile)
```

Karakteristik:

- Menggunakan aplikasi yang sama
- Berbagi data yang sama
- Berbagi konfigurasi plugin
- Halaman dan menu dapat dikonfigurasi secara independen

Cocok untuk skenario ketika peran yang berbeda memerlukan pintu masuk yang berbeda, misalnya:

- Administrator
- Karyawan
- Pelanggan
- Distributor

## Multi-app

Multi-app membagi bisnis menjadi beberapa aplikasi independen.

Contohnya:

```text
Sistem Grup

├─ CRM
├─ ERP
├─ OA
└─ Analitik
```

Karakteristik:

- Setiap aplikasi dikelola secara independen
- Konfigurasi plugin independen
- Koneksi database independen
- Upgrade dan pemeliharaan independen

Cocok untuk:

- Membagi sistem bisnis besar
- Pengembangan kolaboratif oleh banyak tim
- Pembuatan aplikasi secara massal untuk platform SaaS
- Aplikasi independen untuk pelanggan yang berbeda

## Multi-space

Multi-space mengisolasi data bisnis dalam aplikasi yang sama.

Contohnya:

```text
Aplikasi Manajemen Toko

Space
├─ Toko Beijing
├─ Toko Shanghai
└─ Toko Shenzhen
```

Karakteristik:

- Halaman dibagikan
- Menu dibagikan
- Workflow dibagikan
- Konfigurasi dibagikan
- Data terisolasi

Untuk tabel yang mengaktifkan field space, sistem akan secara otomatis memfilter data sesuai space saat ini.

Dari sudut pandang pengguna:

- Toko Beijing hanya dapat melihat data toko Beijing
- Toko Shanghai hanya dapat melihat data toko Shanghai
- Toko Shenzhen hanya dapat melihat data toko Shenzhen

Namun semua toko tetap menggunakan sistem yang sama.

## Hubungan di antara ketiganya

Ketiga kemampuan ini tidak saling bertentangan. Masing-masing bekerja pada dimensi yang berbeda.

Ketiganya dapat digunakan bersama:

```text
Sistem Grup

Aplikasi CRM
├─ Portal Admin
├─ Portal Penjualan
└─ Portal Pelanggan

Space
├─ Cabang Beijing
├─ Cabang Shanghai
└─ Cabang Shenzhen
```

Secara konsep:

```text
Portal
    ↓
Dari mana pengguna masuk ke sistem

App
    ↓
Bagaimana sistem dibagi

Space
    ↓
Siapa pemilik data
```

## Cara memilih

Jika Anda hanya ingin menyediakan pintu masuk yang berbeda untuk peran yang berbeda, pilih **Multi-portal**.

Jika Anda ingin membagi bisnis menjadi beberapa sistem independen, pilih **Multi-app**.

Jika Anda ingin mengisolasi data untuk organisasi atau tenant yang berbeda dalam sistem yang sama, pilih **Multi-space**.

Dalam proyek nyata, ketiga kemampuan ini biasanya digunakan bersama, bukan saling menggantikan.

Dalam satu kalimat:

> Multi-portal menyelesaikan masalah pintu masuk, Multi-app menyelesaikan pembagian sistem, dan Multi-space menyelesaikan isolasi data.
