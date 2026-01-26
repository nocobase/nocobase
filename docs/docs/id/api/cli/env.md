:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Variabel Lingkungan Global

## TZ

Digunakan untuk mengatur zona waktu aplikasi, secara default menggunakan zona waktu sistem operasi.

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
Operasi yang terkait dengan waktu akan diproses berdasarkan zona waktu ini. Mengubah TZ dapat memengaruhi nilai tanggal di basis data. Untuk detail lebih lanjut, lihat '[Ikhtisar Tanggal & Waktu](#)'
:::

## APP_ENV

Lingkungan aplikasi, nilai defaultnya adalah `development`. Pilihan yang tersedia meliputi:

- `production` Lingkungan produksi
- `development` Lingkungan pengembangan

```bash
APP_ENV=production
```

## APP_KEY

Kunci rahasia aplikasi, digunakan untuk menghasilkan token pengguna, dll. Ubah ke kunci aplikasi Anda sendiri dan pastikan tidak bocor ke publik.

:::warning
Jika APP_KEY diubah, token lama akan menjadi tidak valid.
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

Port aplikasi, nilai defaultnya adalah `13000`.

```bash
APP_PORT=13000
```

## API_BASE_PATH

Prefiks alamat API NocoBase, nilai defaultnya adalah `/api/`.

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

Mode startup multi-core (cluster). Jika variabel ini dikonfigurasi, variabel ini akan diteruskan ke perintah `pm2 start` sebagai parameter `-i <instances>`. Pilihan yang tersedia konsisten dengan parameter `-i` pm2 (lihat [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)), meliputi:

- `max`: menggunakan jumlah inti CPU maksimum
- `-1`: menggunakan jumlah inti CPU maksimum dikurangi 1
- `<number>`: menentukan jumlah inti

Nilai defaultnya kosong, yang berarti tidak diaktifkan.

:::warning{title="Perhatian"}
Mode ini perlu digunakan bersama dengan plugin yang terkait dengan mode cluster, jika tidak, fungsionalitas aplikasi mungkin mengalami anomali.
:::

Untuk informasi lebih lanjut, lihat: [Mode Cluster](#).

## PLUGIN_PACKAGE_PREFIX

Prefiks nama paket plugin, defaultnya adalah: `@nocobase/plugin-,@nocobase/preset-`.

Misalnya, untuk menambahkan plugin `hello` ke proyek `my-nocobase-app`, nama paket lengkap plugin tersebut adalah `@my-nocobase-app/plugin-hello`.

PLUGIN_PACKAGE_PREFIX dapat dikonfigurasi sebagai:

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

Maka, pemetaan antara nama plugin dan nama paket adalah sebagai berikut:

- Nama paket untuk plugin `users` adalah `@nocobase/plugin-users`
- Nama paket untuk plugin `nocobase` adalah `@nocobase/preset-nocobase`
- Nama paket untuk plugin `hello` adalah `@my-nocobase-app/plugin-hello`

## DB_DIALECT

Tipe basis data, pilihan yang tersedia meliputi:

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

Host basis data (perlu dikonfigurasi saat menggunakan basis data MySQL atau PostgreSQL).

Nilai defaultnya adalah `localhost`.

```bash
DB_HOST=localhost
```

## DB_PORT

Port basis data (perlu dikonfigurasi saat menggunakan basis data MySQL atau PostgreSQL).

- Port default MySQL, MariaDB adalah 3306
- Port default PostgreSQL adalah 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

Nama basis data (perlu dikonfigurasi saat menggunakan basis data MySQL atau PostgreSQL).

```bash
DB_DATABASE=nocobase
```

## DB_USER

Pengguna basis data (perlu dikonfigurasi saat menggunakan basis data MySQL atau PostgreSQL).

```bash
DB_USER=nocobase
```

## DB_PASSWORD

Kata sandi basis data (perlu dikonfigurasi saat menggunakan basis data MySQL atau PostgreSQL).

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

Prefiks tabel basis data.

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

Apakah nama tabel dan nama kolom basis data akan diubah menjadi gaya *snake case*, defaultnya adalah `false`. Jika Anda menggunakan basis data MySQL (MariaDB) dan `lower_case_table_names=1`, maka DB_UNDERSCORED harus `true`.

:::warning
Ketika `DB_UNDERSCORED=true`, nama tabel dan nama kolom yang sebenarnya di basis data tidak akan konsisten dengan apa yang terlihat di antarmuka. Misalnya, `orderDetails` di basis data akan menjadi `order_details`.
:::

## DB_LOGGING

Sakelar pencatatan log basis data, nilai defaultnya adalah `off`. Pilihan yang tersedia meliputi:

- `on` Diaktifkan
- `off` Dinonaktifkan

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

Metode output log, pisahkan beberapa nilai dengan `,`. Nilai default di lingkungan pengembangan adalah `console`, dan di lingkungan produksi adalah `console,dailyRotateFile`. Pilihan yang tersedia:

- `console` - `console.log`
- `file` - `Berkas`
- `dailyRotateFile` - `Berkas yang berputar harian`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

Jalur penyimpanan log berbasis berkas, defaultnya adalah `storage/logs`.

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

Level output log. Nilai default di lingkungan pengembangan adalah `debug`, dan di lingkungan produksi adalah `info`. Pilihan yang tersedia:

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

Level output log basis data adalah `debug`, dan apakah akan di-output dikendalikan oleh `DB_LOGGING`, tidak terpengaruh oleh `LOGGER_LEVEL`.

## LOGGER_MAX_FILES

Jumlah maksimum berkas log yang akan disimpan.

- Ketika `LOGGER_TRANSPORT` adalah `file`, nilai defaultnya adalah `10`.
- Ketika `LOGGER_TRANSPORT` adalah `dailyRotateFile`, gunakan `[n]d` untuk mewakili jumlah hari. Nilai defaultnya adalah `14d`.

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

Rotasi log berdasarkan ukuran.

- Ketika `LOGGER_TRANSPORT` adalah `file`, unitnya adalah `byte`, dan nilai defaultnya adalah `20971520 (20 * 1024 * 1024)`.
- Ketika `LOGGER_TRANSPORT` adalah `dailyRotateFile`, Anda dapat menggunakan `[n]k`, `[n]m`, `[n]g`. Secara default tidak dikonfigurasi.

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

Format pencetakan log. Default di lingkungan pengembangan adalah `console`, dan di lingkungan produksi adalah `json`. Pilihan yang tersedia:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

Lihat: [Format Log](#)

## CACHE_DEFAULT_STORE

Pengidentifikasi unik untuk metode penyimpanan *cache* yang digunakan, menentukan metode *cache* default sisi server. Nilai defaultnya adalah `memory`. Pilihan bawaan meliputi:

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

Jumlah maksimum item dalam *cache* memori, nilai defaultnya adalah `2000`.

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Koneksi Redis, opsional. Contoh: `redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

Mengaktifkan pengumpulan data telemetri, defaultnya adalah `off`.

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

Pembaca metrik pemantauan yang diaktifkan, defaultnya adalah `console`. Nilai lain harus merujuk pada nama yang terdaftar dari *plugin* pembaca yang sesuai, seperti `prometheus`. Pisahkan beberapa nilai dengan `,`.

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

Prosesor data *trace* yang diaktifkan, defaultnya adalah `console`. Nilai lain harus merujuk pada nama yang terdaftar dari *plugin* prosesor yang sesuai. Pisahkan beberapa nilai dengan `,`.

```bash
TELEMETRY_TRACE_PROCESSOR=console
```