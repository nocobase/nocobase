:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Panduan Keamanan NocoBase

NocoBase sangat memperhatikan keamanan data dan aplikasi, mulai dari desain fungsional hingga implementasi sistem. Platform ini dilengkapi dengan berbagai fitur keamanan bawaan seperti autentikasi pengguna, kontrol akses, dan enkripsi data, serta memungkinkan konfigurasi kebijakan keamanan yang fleksibel sesuai kebutuhan. Baik untuk melindungi data pengguna, mengelola izin akses, maupun mengisolasi lingkungan pengembangan dan produksi, NocoBase menyediakan alat dan solusi praktis. Panduan ini bertujuan untuk memberikan arahan penggunaan NocoBase secara aman, membantu pengguna melindungi keamanan data, aplikasi, dan lingkungan mereka, serta memastikan penggunaan fitur sistem yang efisien dengan tetap menjaga keamanan pengguna.

## Autentikasi Pengguna

Autentikasi pengguna digunakan untuk mengidentifikasi identitas pengguna, mencegah pengguna masuk ke sistem tanpa izin, dan memastikan identitas pengguna tidak disalahgunakan.

### Kunci Token

Secara default, NocoBase menggunakan JWT (JSON Web Token) untuk autentikasi API sisi server. Pengguna dapat mengatur kunci Token melalui variabel lingkungan sistem `APP_KEY`. Harap kelola kunci Token aplikasi dengan baik untuk mencegah kebocoran eksternal. Perlu diperhatikan bahwa jika `APP_KEY` diubah, Token lama juga akan menjadi tidak valid.

### Kebijakan Token

NocoBase mendukung pengaturan kebijakan keamanan berikut untuk Token pengguna:

| Item Konfigurasi                  | Deskripsi