---
pkg: '@nocobase/plugin-ip-restriction'
title: "IP Restriction"
description: "IP Restriction: IP whitelist/blacklist, CIDR network range, log akses ditolak, membatasi akses tidak terotorisasi, perlindungan IP berbahaya, fitur enterprise."
keywords: "IP restriction,IP whitelist,IP blacklist,CIDR,log akses ditolak,enterprise,NocoBase"
---

# IP Restriction

<PluginInfo licenseBundled="enterprise" name="ip-restriction"></PluginInfo>

## Pengantar

NocoBase mendukung administrator mengatur whitelist atau blacklist untuk IP akses user, untuk membatasi koneksi jaringan eksternal yang tidak terotorisasi atau memblokir alamat IP berbahaya yang sudah diketahui, mengurangi risiko keamanan. Sekaligus mendukung administrator melakukan query log akses ditolak, untuk mengidentifikasi IP berisiko.

## Konfigurasi Rule

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Mode Filter IP

- Blacklist: Saat IP akses user cocok dengan IP di list, sistem akan **menolak** akses; IP yang tidak cocok default **diizinkan** akses.
- Whitelist: Saat IP akses user cocok dengan IP di list, sistem akan **mengizinkan** akses; IP yang tidak cocok default **dilarang** akses.

### List IP

Digunakan untuk mendefinisikan alamat IP yang diizinkan atau dilarang mengakses sistem. Efek spesifiknya tergantung pada pilihan mode filter IP. Mendukung input alamat IP atau alamat CIDR network range, beberapa alamat dipisahkan dengan koma atau line break.

## Query Log

Setelah user ditolak aksesnya, IP akses akan ditulis ke system log. Anda dapat men-download file log yang sesuai untuk analisis.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Contoh log:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Saran Konfigurasi

### Saran Mode Blacklist

Tambahkan alamat IP berbahaya yang sudah diketahui untuk mencegah serangan jaringan potensial.
Periksa dan update blacklist secara berkala, hapus IP yang tidak valid atau yang tidak perlu lagi diblokir.

### Saran Mode Whitelist

Tambahkan alamat IP jaringan internal yang dipercaya (seperti network range kantor), untuk memastikan akses aman ke sistem inti.
Hindari memasukkan alamat IP yang dialokasikan secara dinamis di whitelist, untuk mencegah gangguan akses.

### Saran Umum

Gunakan CIDR network range untuk menyederhanakan konfigurasi, contohnya menggunakan 192.168.0.0/24 alih-alih menambahkan alamat IP satu per satu.
Backup konfigurasi list IP secara berkala, agar dapat dengan cepat dipulihkan saat operasi salah atau kegagalan sistem.
Monitor log akses secara berkala, identifikasi IP abnormal dan sesuaikan blacklist/whitelist tepat waktu.
