# Instal melalui Docker Compose

Jika Anda ingin menjalankan NocoBase langsung di server, `docker compose` masih merupakan cara paling langsung. Satu porsi `docker-compose.yml` cukup untuk sebagian besar skenario.

Namun, dalam lingkungan produksi, disarankan untuk memperbaiki nomor versi tertentu dan tidak menggunakan `latest` secara langsung untuk waktu yang lama. Ini akan membuat peningkatan lebih terkendali.

## Prasyarat

- Docker dan Docker Compose terinstal
- Pastikan layanan Docker dimulai
- Pelabuhan untuk dibuka ke dunia luar telah disiapkan, seperti `13000`

## Langkah 1: Buat direktori proyek

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## Langkah 2: Buat `docker-compose.yml`

Contoh berikut menggunakan PostgreSQL, yang juga merupakan kombinasi paling bebas kekhawatiran secara default:

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

di dalam:

- `APP_KEY` Ingatlah untuk mengubahnya ke string acak Anda sendiri
- `13000:80` mewakili pemetaan port `13000` host ke port `80` kontainer
- Jika Anda sudah memiliki layanan database, Anda dapat menghapus bagian `postgres` dan mengubah `DB_HOST` ke alamat database yang ada

Jika Anda menggunakan MySQL atau MariaDB, ingatlah untuk mengubah `DB_DIALECT` ke tipe yang sesuai dan tambahkan:

```bash
DB_UNDERSCORED=true
```

## Langkah 3: Mulai aplikasi

```bash
docker compose up -d
```

Periksa lognya:

```bash
docker compose logs -f app
```

## Langkah 4: Akses aplikasi

Setelah aplikasi dimulai, buka:

```text
http://<服务器IP>:13000
```

Jika ini adalah pertama kalinya memulai, cukup ikuti petunjuk halaman untuk menginisialisasi akun administrator.

## Perintah umum

Memulai atau memperbarui kontainer:

```bash
docker compose up -d
```

Hentikan aplikasi:

```bash
docker compose down
```

Periksa lognya:

```bash
docker compose logs -f app
```

## Di mana mencarinya selanjutnya

- Jika ingin menyesuaikan konfigurasi kunci, port, database, dll, lanjutkan melihat [Variabel Lingkungan Aplikasi](./env.md)
- Jika Anda sudah siap online secara resmi, lanjutkan membaca [Nginx](../production/reverse-proxy/nginx.md) atau [Caddy](../production/reverse-proxy/caddy.md)
- Jika nanti ingin membackup data, lihat terus [Backup dan Restore](../operations/backup-restore.md)
