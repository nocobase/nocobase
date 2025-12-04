:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Persiapan

Sebelum menerapkan aplikasi klaster, Anda perlu menyelesaikan persiapan berikut.

## Lisensi Plugin Komersial

Menjalankan aplikasi NocoBase dalam mode klaster memerlukan dukungan dari plugin berikut:

| Fungsi                  | Plugin                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Adaptor cache           | Bawaan                                                                              |
| Adaptor sinyal sinkronisasi | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Adaptor antrean pesan   | `@nocobase/plugin-queue-adapter-redis` atau `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adaptor kunci terdistribusi | `@nocobase/plugin-lock-adapter-redis`                                               |
| Alokator Worker ID      | `@nocobase/plugin-workerid-allocator-redis`                                         |

Pertama, pastikan Anda telah memperoleh lisensi untuk plugin di atas (Anda dapat membeli lisensi plugin yang sesuai melalui platform layanan plugin komersial).

## Komponen Sistem

Komponen sistem lainnya, selain dari instans aplikasi itu sendiri, dapat dipilih oleh personel operasional berdasarkan kebutuhan operasional tim.

### Basis Data

Karena mode klaster saat ini hanya menargetkan instans aplikasi, basis data sementara hanya mendukung satu node. Jika Anda memiliki arsitektur basis data seperti master-slave, Anda perlu mengimplementasikannya sendiri melalui middleware dan memastikan transparansi terhadap aplikasi NocoBase.

### Middleware

Mode klaster NocoBase bergantung pada beberapa middleware untuk mencapai komunikasi dan koordinasi antar-klaster, termasuk:

- **Cache**: Menggunakan middleware cache terdistribusi berbasis Redis untuk meningkatkan kecepatan akses data.
- **Sinyal sinkronisasi**: Menggunakan fitur stream berbasis Redis untuk mengimplementasikan transmisi sinyal sinkronisasi antar-klaster.
- **Antrean pesan**: Menggunakan middleware antrean pesan berbasis Redis atau RabbitMQ untuk mengimplementasikan pemrosesan pesan asinkron.
- **Kunci terdistribusi**: Menggunakan kunci terdistribusi berbasis Redis untuk memastikan keamanan akses ke sumber daya bersama dalam klaster.

Ketika semua komponen middleware menggunakan Redis, Anda dapat memulai satu layanan Redis di dalam jaringan internal klaster (atau Kubernetes). Atau, Anda dapat mengaktifkan layanan Redis terpisah untuk setiap fungsi (cache, sinyal sinkronisasi, antrean pesan, dan kunci terdistribusi).

**Rekomendasi Versi**

- Redis: >=8.0 atau versi redis-stack yang menyertakan fitur Bloom Filter.
- RabbitMQ: >=4.0

### Penyimpanan Bersama

NocoBase perlu menggunakan direktori `storage` untuk menyimpan file terkait sistem. Dalam mode multi-node, Anda harus memasang disk cloud (atau NFS) untuk mendukung akses bersama antar-node. Jika tidak, penyimpanan lokal tidak akan disinkronkan secara otomatis, dan tidak akan berfungsi dengan baik.

Saat menerapkan dengan Kubernetes, silakan merujuk ke bagian [Penerapan Kubernetes: Penyimpanan Bersama](./kubernetes#shared-storage).

### Penyeimbangan Beban

Mode klaster memerlukan penyeimbang beban untuk mendistribusikan permintaan, serta untuk pemeriksaan kesehatan dan failover instans aplikasi. Bagian ini harus dipilih dan dikonfigurasi sesuai dengan kebutuhan operasional tim.

Mengambil Nginx yang di-host sendiri sebagai contoh, tambahkan konten berikut ke file konfigurasi:

```
upstream myapp {
    # ip_hash; # Dapat digunakan untuk persistensi sesi. Saat diaktifkan, permintaan dari klien yang sama selalu dikirim ke server backend yang sama.
    server 172.31.0.1:13000; # Node internal 1
    server 172.31.0.2:13000; # Node internal 2
    server 172.31.0.3:13000; # Node internal 3
}

server {
    listen 80;

    location / {
        # Gunakan upstream yang ditentukan untuk penyeimbangan beban
        proxy_pass http://myapp;
        # ... konfigurasi lainnya
    }
}
```

Ini berarti permintaan di-proxy balik dan didistribusikan ke node server yang berbeda untuk diproses.

Untuk middleware penyeimbangan beban yang disediakan oleh penyedia layanan cloud lainnya, silakan merujuk ke dokumentasi konfigurasi yang disediakan oleh penyedia tertentu.

## Konfigurasi Variabel Lingkungan

Semua node dalam klaster harus menggunakan konfigurasi variabel lingkungan yang sama. Selain [variabel lingkungan](/api/cli/env) dasar NocoBase, variabel lingkungan terkait middleware berikut juga perlu dikonfigurasi.

### Mode Multi-core

Ketika aplikasi berjalan pada node multi-core, Anda dapat mengaktifkan mode multi-core node:

```ini
# Mengaktifkan mode multi-core PM2
# CLUSTER_MODE=max # Dinonaktifkan secara default, memerlukan konfigurasi manual
```

Jika Anda menerapkan pod aplikasi di Kubernetes, Anda dapat mengabaikan konfigurasi ini dan mengontrol jumlah instans aplikasi melalui jumlah replika pod.

### Cache

```ini
# Adaptor cache, perlu diatur ke redis dalam mode klaster (defaultnya adalah in-memory jika tidak diatur)
CACHE_DEFAULT_STORE=redis

# URL koneksi adaptor cache Redis, perlu diisi
CACHE_REDIS_URL=
```

### Sinyal Sinkronisasi

```ini
# URL koneksi adaptor sinkronisasi Redis, defaultnya adalah redis://localhost:6379/0 jika tidak diatur
PUBSUB_ADAPTER_REDIS_URL=
```

### Kunci Terdistribusi

```ini
# Adaptor kunci, perlu diatur ke redis dalam mode klaster (defaultnya adalah kunci lokal in-memory jika tidak diatur)
LOCK_ADAPTER_DEFAULT=redis

# URL koneksi adaptor kunci Redis, defaultnya adalah redis://localhost:6379/0 jika tidak diatur
LOCK_ADAPTER_REDIS_URL=
```

### Antrean Pesan

```ini
# Mengaktifkan Redis sebagai adaptor antrean pesan, defaultnya adalah adaptor in-memory jika tidak diatur
QUEUE_ADAPTER=redis
# URL koneksi adaptor antrean pesan Redis, defaultnya adalah redis://localhost:6379/0 jika tidak diatur
QUEUE_ADAPTER_REDIS_URL=
```

### Alokator Worker ID

Beberapa `koleksi` sistem di NocoBase menggunakan ID unik global sebagai kunci utama. Untuk mencegah konflik kunci utama di seluruh klaster, setiap instans aplikasi harus mendapatkan Worker ID yang unik melalui Alokator Worker ID. Rentang Worker ID saat ini adalah 0–31, yang berarti setiap aplikasi dapat menjalankan hingga 32 node secara bersamaan. Untuk detail tentang desain ID unik global, lihat [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id)

```ini
# URL koneksi Redis untuk Alokator Worker ID.
# Jika dihilangkan, Worker ID acak akan ditetapkan.
REDIS_URL=
```

:::info{title=Tips}
Biasanya, adaptor terkait dapat menggunakan instans Redis yang sama, tetapi sebaiknya gunakan basis data yang berbeda untuk menghindari potensi masalah konflik kunci, misalnya:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Saat ini, setiap `plugin` menggunakan konfigurasi variabel lingkungan Redis-nya sendiri. Di masa mendatang, kami mungkin akan mempertimbangkan untuk menggunakan `REDIS_URL` secara terpadu sebagai konfigurasi cadangan.

:::

Jika Anda menggunakan Kubernetes untuk mengelola klaster, Anda dapat mengonfigurasi variabel lingkungan di atas dalam ConfigMap atau Secret. Untuk konten terkait lainnya, Anda dapat merujuk ke [Penerapan Kubernetes](./kubernetes).

Setelah semua persiapan di atas selesai, Anda dapat melanjutkan ke [Operasi](./operations) untuk terus mengelola instans aplikasi.