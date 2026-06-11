---
pkg: "@nocobase/preset-cluster"
title: "Persiapan Deployment Cluster"
description: "Persiapan sebelum deployment cluster: lisensi plugin commercial (PubSub, Queue, Lock, adapter WorkerID), database, middleware Redis/RabbitMQ, shared storage, konfigurasi load balancing."
keywords: "persiapan cluster,lisensi plugin commercial,middleware Redis,RabbitMQ,shared storage,load balancing,Nginx,NocoBase"
---

# Persiapan

Sebelum men-deploy aplikasi cluster, persiapan berikut perlu diselesaikan.

## Lisensi Plugin Commercial

Aplikasi NocoBase yang berjalan dalam mode cluster memerlukan dukungan dari plugin berikut:

| Fitur                | Plugin                                                                              |
| -------------------- | ----------------------------------------------------------------------------------- |
| Cache adapter        | Built-in                                                                            |
| Sync signal adapter  | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Message queue adapter | `@nocobase/plugin-queue-adapter-redis` atau `@nocobase/plugin-queue-adapter-rabbitmq` |
| Distributed lock adapter | `@nocobase/plugin-lock-adapter-redis`                                           |
| Worker ID allocator  | `@nocobase/plugin-workerid-allocator-redis`                                         |

Pertama, pastikan Anda telah memperoleh lisensi untuk plugin di atas (Anda dapat membeli lisensi plugin yang sesuai melalui platform layanan plugin commercial).

## Komponen Sistem

Komponen sistem selain instance aplikasi itu sendiri, dapat dipilih sendiri oleh tim operasional sesuai dengan kebutuhan operasional masing-masing tim.

### Database

Karena cluster mode saat ini hanya ditujukan untuk instance aplikasi, database sementara hanya mendukung single-node. Jika ada arsitektur database master-slave atau lainnya, Anda perlu mengimplementasikannya sendiri melalui middleware, dan memastikan transparan terhadap aplikasi NocoBase.

### Middleware

Cluster mode NocoBase membutuhkan beberapa middleware untuk komunikasi dan koordinasi antar cluster, termasuk:

- **Cache**: Menggunakan distributed cache middleware berbasis Redis untuk meningkatkan kecepatan akses data.
- **Sync signal**: Menggunakan fitur stream Redis untuk implementasi transmisi sync signal antar cluster.
- **Message queue**: Menggunakan message queue middleware berbasis Redis atau RabbitMQ untuk pemrosesan pesan asinkron.
- **Distributed lock**: Menggunakan distributed lock berbasis Redis untuk menjamin keamanan akses ke shared resource dalam cluster.

Saat semua middleware menggunakan Redis, Anda dapat menjalankan satu service Redis tunggal dalam jaringan internal cluster (atau Kubernetes). Anda juga dapat mengaktifkan service Redis terpisah untuk setiap fitur (cache, sync signal, message queue, dan distributed lock).

**Rekomendasi Versi**

- Redis: >=8.0 atau gunakan versi redis-stack yang mencakup fitur Bloom Filter.
- RabbitMQ: >=4.0

### Shared Storage

NocoBase membutuhkan direktori storage untuk menyimpan file terkait sistem. Dalam mode multi-node, harus melakukan mounting cloud disk (atau NFS) untuk mendukung akses bersama antar node. Jika tidak, local storage tidak akan disinkronkan secara otomatis dan tidak dapat digunakan dengan benar.

Saat menggunakan deployment Kubernetes, silakan merujuk ke section [Deployment Kubernetes: Shared Storage](./kubernetes#shared-storage).

### Load Balancing

Cluster mode membutuhkan load balancer untuk distribusi request, serta health check dan failover instance aplikasi. Bagian ini dipilih dan dikonfigurasi sendiri sesuai kebutuhan operasional tim.

Sebagai contoh dengan self-hosted Nginx, tambahkan konten berikut di file konfigurasi:

```
upstream myapp {
    # ip_hash; # Dapat digunakan untuk session persistence, jika diaktifkan request dari client yang sama selalu dikirim ke backend server yang sama.
    server 172.31.0.1:13000; # Internal node 1
    server 172.31.0.2:13000; # Internal node 2
    server 172.31.0.3:13000; # Internal node 3
}

server {
    listen 80;

    location / {
        # Menggunakan upstream yang didefinisikan untuk load balancing
        proxy_pass http://myapp;
        # ... konfigurasi lainnya
    }
}
```

Yang berarti melakukan reverse proxy dan mendistribusikan request ke node server yang berbeda untuk diproses.

Middleware load balancing yang disediakan oleh cloud service provider lain dapat merujuk ke dokumentasi konfigurasi yang disediakan provider tersebut.

## Konfigurasi Environment Variable

Semua node dalam cluster harus menggunakan konfigurasi environment variable yang sama. Selain [environment variable](../api/app/env) dasar NocoBase, environment variable berikut yang terkait dengan middleware juga perlu dikonfigurasi.

### Multi-Core Mode

Saat aplikasi berjalan di node multi-core, multi-core mode pada node dapat diaktifkan:

```ini
# Aktifkan PM2 multi-core mode
# CLUSTER_MODE=max # Default tidak diaktifkan, perlu konfigurasi manual
```

Jika men-deploy pod aplikasi di Kubernetes, Anda dapat mengabaikan konfigurasi ini, dan mengontrol jumlah instance aplikasi melalui jumlah replika pod.

### Cache

```ini
# Cache adapter, dalam cluster mode perlu diisi sebagai redis (default tidak diisi adalah memory)
CACHE_DEFAULT_STORE=redis

# Alamat koneksi Redis cache adapter, perlu diisi secara aktif
CACHE_REDIS_URL=
```

### Sync Signal

```ini
# Alamat koneksi Redis sync adapter, default tidak diisi adalah redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### Distributed Lock

```ini
# Lock adapter, dalam cluster mode perlu diisi sebagai redis (default tidak diisi adalah memory local lock)
LOCK_ADAPTER_DEFAULT=redis

# Alamat koneksi Redis lock adapter, default tidak diisi adalah redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### Message Queue

```ini
# Mengaktifkan Redis sebagai message queue adapter, default tidak diisi adalah memory adapter
QUEUE_ADAPTER=redis
# Alamat koneksi Redis message queue adapter, default tidak diisi adalah redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID Allocator

Karena beberapa tabel sistem di NocoBase menggunakan globally unique ID sebagai primary key, Worker ID allocator diperlukan untuk memastikan setiap instance aplikasi dalam cluster mendapat Worker ID unik, sehingga menghindari masalah primary key conflict. Saat ini Worker ID dirancang dalam rentang 0-31, artinya aplikasi yang sama mendukung maksimal 32 node berjalan bersamaan. Tentang desain globally unique ID, lihat [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id)

```ini
# Alamat koneksi Redis Worker ID allocator, default tidak diisi adalah random allocation
REDIS_URL=
```

:::info{title=Tips}
Biasanya, adapter terkait dapat menggunakan instance Redis yang sama, tetapi sebaiknya menggunakan database yang berbeda untuk menghindari kemungkinan key conflict, contohnya:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Pada tahap saat ini setiap plugin menggunakan konfigurasi environment variable Redis sendiri-sendiri, di masa depan akan dipertimbangkan untuk menggunakan `REDIS_URL` sebagai konfigurasi fallback secara terpadu.

:::

Jika menggunakan Kubernetes untuk mengelola cluster, environment variable di atas dapat dikonfigurasi di ConfigMap atau Secret. Untuk lebih banyak konten terkait, lihat [Deployment Kubernetes](./kubernetes).

Setelah semua persiapan di atas selesai, Anda dapat melanjutkan ke [Alur Operasi](./operations) untuk terus mengelola instance aplikasi.
