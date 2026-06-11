#Instalasi intranet

Jika server Anda tidak dapat mengakses jaringan publik, metode instalasi mengharuskan Anda menyiapkan terlebih dahulu gambar, dependensi, dan paket plug-in yang diperlukan untuk penggunaan offline. Secara default, disarankan untuk menggunakan Docker terlebih dahulu, yang memiliki jalur terpendek dan paling mudah untuk direproduksi.

## Rekomendasi default: Siapkan image Docker secara offline

Pada mesin yang dapat mengakses jaringan publik, pertama-tama tarik ke bawah gambar aplikasi dan gambar database:

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Kemudian ekspor sebagai file offline:

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Jika Anda masih memerlukan plug-in komersial, disarankan juga untuk menyiapkan paket plug-in di lingkungan jaringan eksternal dan kemudian membawanya ke intranet bersama-sama.

## Salin file ke server intranet

Siapkan setidaknya dokumen-dokumen ini:

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` atau instruksi penerapan Anda sendiri

## Impor gambar ke server intranet

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Mulai aplikasi

Setelah menyiapkan `docker-compose.yml`, langsung mulai:

```bash
docker compose up -d
docker compose logs -f app
```

Jika Anda belum menulis file penulisan, baca dulu [Instalasi melalui Docker Compose](./docker-compose.md) dan simpan contoh di sana secara lokal.

## Apa yang harus dilakukan jika Anda tidak dapat menggunakan Docker

Jika Docker tidak dapat digunakan di lingkungan intranet Anda, Anda juga dapat menggunakan `create-nocobase-app` untuk membuat proyek lengkap di lingkungan jaringan eksternal, menginstal dependensi dan mengemasnya, lalu menyalin seluruh proyek ke server intranet.

Jalur ini akan lebih panjang, namun lebih praktis di lingkungan tanpa kemampuan container. Proses keseluruhan biasanya:

1. Buat proyek di lingkungan jaringan eksternal dan instal dependensi.
2. Kemas direktori proyek.
3. Salin ke server intranet.
4. Buka zip file di intranet, selesaikan `.env` dan mulai aplikasi.

## Di mana mencarinya selanjutnya

- Jika Anda belum mengonfirmasi konfigurasi aplikasi, lanjutkan melihat [Variabel Lingkungan Aplikasi](./env.md)
- Jika sudah siap membuka aplikasi secara resmi untuk pengguna bisnis, lanjutkan membaca [Nginx](../production/reverse-proxy/nginx.md) atau [Caddy](../production/reverse-proxy/caddy.md)
