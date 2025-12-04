---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



pkg: '@nocobase/plugin-ip-restriction'
---

# Pembatasan IP

## Pendahuluan

NocoBase memungkinkan administrator untuk mengatur daftar putih (whitelist) atau daftar hitam (blacklist) untuk IP akses pengguna. Ini bertujuan untuk membatasi koneksi jaringan eksternal yang tidak sah atau memblokir alamat IP berbahaya yang diketahui, sehingga mengurangi risiko keamanan. Administrator juga dapat melihat log penolakan akses untuk mengidentifikasi IP yang berisiko.

## Aturan Konfigurasi

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Mode Pemfilteran IP

- **Daftar Hitam (Blacklist)**: Ketika IP akses pengguna cocok dengan IP dalam daftar, sistem akan **menolak** akses; IP yang tidak cocok secara default akan **diizinkan** akses.
- **Daftar Putih (Whitelist)**: Ketika IP akses pengguna cocok dengan IP dalam daftar, sistem akan **mengizinkan** akses; IP yang tidak cocok secara default akan **ditolak** akses.

### Daftar IP

Digunakan untuk mendefinisikan alamat IP yang diizinkan atau ditolak aksesnya ke sistem. Fungsi spesifiknya bergantung pada mode pemfilteran IP yang dipilih. Anda dapat memasukkan alamat IP atau segmen jaringan CIDR, dengan beberapa alamat dipisahkan oleh koma atau baris baru.

## Melihat Log

Setelah pengguna ditolak aksesnya, IP akses akan dicatat ke dalam log sistem. Anda dapat mengunduh file log yang sesuai untuk analisis.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Contoh Log:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Rekomendasi Konfigurasi

### Rekomendasi Mode Daftar Hitam

- Tambahkan alamat IP berbahaya yang diketahui untuk mencegah potensi serangan jaringan.
- Periksa dan perbarui daftar hitam secara berkala, hapus alamat IP yang tidak valid atau tidak lagi perlu diblokir.

### Rekomendasi Mode Daftar Putih

- Tambahkan alamat IP jaringan internal yang tepercaya (misalnya, segmen jaringan kantor) untuk memastikan akses aman ke sistem inti.
- Hindari menyertakan alamat IP yang ditetapkan secara dinamis dalam daftar putih untuk mencegah gangguan akses.

### Rekomendasi Umum

- Gunakan segmen jaringan CIDR untuk menyederhanakan konfigurasi, misalnya menggunakan `192.168.0.0/24` daripada menambahkan alamat IP satu per satu.
- Cadangkan konfigurasi daftar IP secara berkala agar dapat pulih dengan cepat jika terjadi kesalahan operasi atau kegagalan sistem.
- Pantau log akses secara berkala untuk mengidentifikasi IP yang tidak normal dan segera sesuaikan daftar hitam atau daftar putih.