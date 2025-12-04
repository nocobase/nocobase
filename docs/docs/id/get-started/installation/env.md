:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Variabel Lingkungan

## Bagaimana Cara Mengatur Variabel Lingkungan?

### Metode Instalasi Kode Sumber Git atau `create-nocobase-app`

Atur variabel lingkungan di berkas `.env` yang berada di direktori akar proyek. Setelah mengubah variabel lingkungan, Anda perlu menghentikan proses aplikasi dan memulainya kembali.

### Metode Instalasi Docker

Ubah konfigurasi `docker-compose.yml` dan atur variabel lingkungan pada parameter `environment`. Contoh:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

Anda juga bisa menggunakan `env_file` untuk mengatur variabel lingkungan di berkas `.env`. Contoh:

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

Setelah mengubah variabel lingkungan, Anda perlu membangun ulang kontainer aplikasi:

```yml
docker compose up -d app
```

## Variabel Lingkungan Global

### TZ

Digunakan untuk mengatur zona waktu aplikasi, nilai bawaannya adalah zona waktu sistem operasi.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operasi terkait waktu akan diproses berdasarkan zona waktu ini. Mengubah TZ dapat memengaruhi nilai tanggal di basis data. Untuk detail lebih lanjut, lihat [Ikhtisar Tanggal & Waktu](/data-sources/data-modeling/collection-fields/datetime).
:::

### APP_ENV

Lingkungan aplikasi, nilai bawaannya adalah `development`, opsi yang tersedia meliputi:

- `production` lingkungan produksi
- `development` lingkungan pengembangan

```bash
APP_ENV=production
```

### APP_KEY

Kunci rahasia aplikasi, digunakan untuk menghasilkan token pengguna, dll. Ubah ke kunci aplikasi Anda sendiri dan pastikan tidak bocor ke pihak luar.

:::warning
Jika APP_KEY diubah, token lama juga akan menjadi tidak valid.
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

Port aplikasi, nilai bawaannya adalah `13000`.

```bash
APP_PORT=13000
```

### API_BASE_PATH

Prefiks alamat API NocoBase, nilai bawaannya adalah `/api/`.

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

Mode mulai multi-core (klaster). Jika variabel ini dikonfigurasi, variabel ini akan diteruskan ke perintah `pm2 start` sebagai parameter `-i <instances>`. Opsi-opsinya konsisten dengan parameter `-i` pm2 (lihat [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), meliputi:

- `max`: Menggunakan jumlah core CPU maksimum
- `-1`: Menggunakan jumlah core CPU maksimum dikurangi satu
- `<number>`: Menentukan jumlah core

Nilai bawaannya kosong, yang berarti tidak diaktifkan.

:::warning{title="Perhatian"}
Mode ini memerlukan penggunaan **plugin** terkait mode klaster. Jika tidak, fungsionalitas aplikasi mungkin mengalami masalah yang tidak terduga.
:::

Untuk informasi lebih lanjut, lihat [Mode Klaster](/cluster-mode).

### PLUGIN_PACKAGE_PREFIX

Prefiks nama paket **plugin**, nilai bawaannya adalah: `@nocobase/plugin-,@nocobase/preset-`.

Misalnya, untuk menambahkan **plugin** `hello` ke proyek `my-nocobase-app`, nama paket lengkap **plugin** tersebut adalah `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX dapat dikonfigurasi sebagai:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Maka, korespondensi antara nama **plugin** dan nama paket adalah sebagai berikut:

- Nama paket **plugin** `users` adalah `@nocobase/plugin-users`
- Nama paket **plugin** `nocobase` adalah `@nocobase/preset-nocobase`
- Nama paket **plugin** `hello` adalah `@my-nocobase-app/plugin-hello`

### DB_DIALECT

Tipe basis data, opsi yang tersedia meliputi:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

Host basis data (diperlukan saat menggunakan basis data MySQL atau PostgreSQL).

Nilai bawaannya adalah `localhost`.

```bash
DB_HOST=localhost
```

### DB_PORT

Port basis data (diperlukan saat menggunakan basis data MySQL atau PostgreSQL).

- Port bawaan untuk MySQL dan MariaDB adalah 3306
- Port bawaan untuk PostgreSQL adalah 5432

```bash
DB_PORT=3306
```

### DB_DATABASE

Nama basis data (diperlukan saat menggunakan basis data MySQL atau PostgreSQL).

```bash
DB_DATABASE=nocobase
```

### DB_USER

Pengguna basis data (diperlukan saat menggunakan basis data MySQL atau PostgreSQL).

```bash
DB_USER=nocobase
```

### DB_PASSWORD

Kata sandi basis data (diperlukan saat menggunakan basis data MySQL atau PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

Prefiks tabel data.

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

Apakah nama tabel dan nama bidang basis data dikonversi ke gaya *snake case*. Nilai bawaannya adalah `false`. Jika menggunakan basis data MySQL (MariaDB) dan `lower_case_table_names=1`, maka DB_UNDERSCORED harus diatur ke `true`.

:::warning
Ketika `DB_UNDERSCORED=true`, nama tabel dan nama bidang yang sebenarnya di basis data tidak akan cocok dengan yang terlihat di antarmuka pengguna. Misalnya, `orderDetails` akan disimpan sebagai `order_details` di basis data.
:::

### DB_LOGGING

Sakelar log basis data, nilai bawaannya adalah `off`, opsi yang tersedia meliputi:

- `on` aktif
- `off` nonaktif

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

Jumlah koneksi maksimum dalam *pool* koneksi basis data, nilai bawaannya adalah `5`.

### DB_POOL_MIN

Jumlah koneksi minimum dalam *pool* koneksi basis data, nilai bawaannya adalah `0`.

### DB_POOL_IDLE

Waktu idle *pool* koneksi basis data, nilai bawaannya adalah `10000` (10 detik).

### DB_POOL_ACQUIRE

Waktu tunggu maksimum untuk mendapatkan koneksi dari *pool* koneksi basis data, nilai bawaannya adalah `60000` (60 detik).

### DB_POOL_EVICT

Waktu hidup maksimum koneksi *pool* basis data, nilai bawaannya adalah `1000` (1 detik).

### DB_POOL_MAX_USES

Jumlah penggunaan koneksi sebelum dibuang dan diganti, nilai bawaannya adalah `0` (tidak terbatas).

### LOGGER_TRANSPORT

Metode keluaran log, beberapa nilai dipisahkan dengan `,`. Nilai bawaannya adalah `console` di lingkungan pengembangan, dan `console,dailyRotateFile` di lingkungan produksi.
Opsi yang tersedia:

- `console` - `console.log`
- `file` - Keluaran ke berkas
- `dailyRotateFile` - Keluaran ke berkas yang berputar harian

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

Jalur penyimpanan log berbasis berkas, nilai bawaannya adalah `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

Tingkat keluaran log. Nilai bawaannya adalah `debug` di lingkungan pengembangan, dan `info` di lingkungan produksi. Opsi yang tersedia:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Tingkat keluaran log basis data adalah `debug`, dikendalikan oleh `DB_LOGGING` apakah akan dikeluarkan atau tidak, dan tidak terpengaruh oleh `LOGGER_LEVEL`.

### LOGGER_MAX_FILES

Jumlah maksimum berkas log yang disimpan.

- Ketika `LOGGER_TRANSPORT` adalah `file`: Nilai bawaannya adalah `10`.
- Ketika `LOGGER_TRANSPORT` adalah `dailyRotateFile`, gunakan `[n]d` untuk merepresentasikan jumlah hari. Nilai bawaannya adalah `14d`.

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

Rotasi log berdasarkan ukuran.

- Ketika `LOGGER_TRANSPORT` adalah `file`: Unitnya adalah `byte`, nilai bawaannya adalah `20971520 (20 * 1024 * 1024)`.
- Ketika `LOGGER_TRANSPORT` adalah `dailyRotateFile`, Anda dapat menggunakan `[n]k`, `[n]m`, `[n]g`. Nilai bawaannya tidak dikonfigurasi.

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

Format cetak log. Nilai bawaannya adalah `console` di lingkungan pengembangan, dan `json` di lingkungan produksi. Opsi yang tersedia:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Referensi: [Format Log](/log-and-monitor/logger/index.md#log-format)

### CACHE_DEFAULT_STORE

Pengidentifikasi unik untuk metode *caching*, menentukan metode *cache* bawaan server, nilai bawaannya adalah `memory`, opsi bawaan meliputi:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

Jumlah maksimum item dalam *cache* memori, nilai bawaannya adalah `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

URL koneksi Redis, opsional. Contoh: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

Mengaktifkan pengumpulan data telemetri, nilai bawaannya adalah `off`.

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

Kolektor metrik pemantauan yang diaktifkan, nilai bawaannya adalah `console`. Nilai lain harus merujuk pada nama yang terdaftar oleh **plugin** kolektor yang sesuai, seperti `prometheus`. Beberapa nilai dipisahkan dengan `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

Prosesor data jejak yang diaktifkan, nilai bawaannya adalah `console`. Nilai lain harus merujuk pada nama yang terdaftar oleh **plugin** prosesor yang sesuai. Beberapa nilai dipisahkan dengan `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## Variabel Lingkungan Eksperimental

### APPEND_PRESET_LOCAL_PLUGINS

Digunakan untuk menambahkan **plugin** lokal prasetel yang belum aktif. Nilainya adalah nama paket **plugin** (parameter `name` di `package.json`), dengan beberapa **plugin** dipisahkan oleh koma.

:::info
1. Pastikan **plugin** sudah diunduh secara lokal dan dapat ditemukan di direktori `node_modules`. Untuk detail lebih lanjut, lihat [Struktur Proyek Plugin](/plugin-development/project-structure).
2. Setelah menambahkan variabel lingkungan, **plugin** akan muncul di halaman manajer **plugin** hanya setelah instalasi awal (`nocobase install`) atau peningkatan (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

Digunakan untuk menambahkan **plugin** bawaan yang diinstal secara default. Nilainya adalah nama paket **plugin** (parameter `name` di `package.json`), dengan beberapa **plugin** dipisahkan oleh koma.

:::info
1. Pastikan **plugin** sudah diunduh secara lokal dan dapat ditemukan di direktori `node_modules`. Untuk detail lebih lanjut, lihat [Struktur Proyek Plugin](/plugin-development/project-structure).
2. Setelah menambahkan variabel lingkungan, **plugin** akan secara otomatis diinstal atau ditingkatkan selama instalasi awal (`nocobase install`) atau peningkatan (`nocobase upgrade`).
:::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## Variabel Lingkungan Sementara

Saat menginstal NocoBase, Anda dapat mengatur variabel lingkungan sementara untuk membantu instalasi, seperti:

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# Setara dengan
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# Setara dengan
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

Bahasa saat instalasi. Nilai bawaannya adalah `en-US`. Opsi yang tersedia meliputi:

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Email pengguna *Root*.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Kata sandi pengguna *Root*.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Nama panggilan pengguna *Root*.

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```