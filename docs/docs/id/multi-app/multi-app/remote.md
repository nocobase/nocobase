---
pkg: '@nocobase/plugin-app-supervisor'
title: "Mode Deployment Campuran Multi-Environment"
description: "Mode multi-environment: aplikasi entry point Supervisor + aplikasi worker Worker, Redis untuk konfigurasi cache dan komunikasi command, APP_MODE, ENVIRONMENT_NAME, deployment Docker Compose, proxy akses aplikasi."
keywords: "multi-environment,mode remote,Supervisor,Worker,APP_MODE,Redis,Docker Compose,proxy aplikasi,NocoBase"
---
# Mode Multi-Environment

## Pengantar

Multi-app mode shared memory memiliki keuntungan signifikan dalam deployment dan operasi, tetapi seiring meningkatnya jumlah aplikasi dan kompleksitas bisnis, single instance dapat secara bertahap menghadapi masalah seperti resource contention dan penurunan stabilitas. Untuk skenario seperti ini, pengguna dapat mengadopsi solusi deployment campuran multi-environment untuk mendukung kebutuhan bisnis yang lebih kompleks.

Dalam mode ini, sistem men-deploy satu aplikasi entry point sebagai pusat manajemen dan scheduling terpadu, sekaligus men-deploy beberapa instance NocoBase sebagai environment runtime aplikasi independen, bertanggung jawab untuk benar-benar menampung aplikasi bisnis. Setiap environment terisolasi dan berkolaborasi, sehingga secara efektif mendistribusikan beban single instance, secara signifikan meningkatkan stabilitas, skalabilitas, dan kemampuan isolasi failure sistem.

Pada level deployment, environment yang berbeda dapat berjalan di proses independen, atau di-deploy sebagai container Docker yang berbeda, atau dalam bentuk beberapa Kubernetes Deployment, dapat secara fleksibel beradaptasi dengan environment infrastruktur dengan skala dan arsitektur yang berbeda.

## Deployment

Dalam mode deployment campuran multi-environment:

- Aplikasi entry point (Supervisor) bertanggung jawab untuk manajemen aplikasi dan informasi environment secara terpadu
- Aplikasi worker (Worker) sebagai environment runtime bisnis aktual
- Konfigurasi aplikasi dan environment di-cache melalui Redis
- Sinkronisasi command dan status antara aplikasi entry point dan aplikasi worker bergantung pada komunikasi Redis

Saat ini fitur pembuatan environment belum disediakan, setiap aplikasi worker perlu di-deploy secara manual dan dikonfigurasi dengan informasi environment yang sesuai sebelum dapat dikenali oleh aplikasi entry point.

### Dependensi Arsitektur

Sebelum deployment, harap siapkan service berikut:

- Redis
  - Cache konfigurasi aplikasi dan environment
  - Sebagai channel komunikasi command antara aplikasi entry point dan aplikasi worker

- Database
  - Service database yang perlu dihubungkan oleh aplikasi entry point dan aplikasi worker

### Aplikasi Entry Point (Supervisor)

Aplikasi entry point sebagai pusat manajemen terpadu, bertanggung jawab untuk pembuatan, startup, stop aplikasi, dan scheduling environment, serta proxy akses aplikasi.

Penjelasan konfigurasi environment variable aplikasi entry point

```bash
# Mode aplikasi
APP_MODE=supervisor
# Cara penemuan aplikasi
APP_DISCOVERY_ADAPTER=remote
# Cara manajemen proses aplikasi
APP_PROCESS_ADAPTER=remote
# Cache redis konfigurasi aplikasi dan environment
APP_SUPERVISOR_REDIS_URL=
# Cara komunikasi command aplikasi
APP_COMMAND_ADPATER=redis
# Redis komunikasi command aplikasi
APP_COMMAND_REDIS_URL=
```

### Aplikasi Worker (Worker)

Aplikasi worker sebagai environment runtime bisnis aktual, bertanggung jawab untuk menampung dan menjalankan instance aplikasi NocoBase secara konkret.

Penjelasan konfigurasi environment variable aplikasi worker

```bash
# Mode aplikasi
APP_MODE=worker
# Cara penemuan aplikasi
APP_DISCOVERY_ADAPTER=remote
# Cara manajemen proses aplikasi
APP_PROCESS_ADAPTER=local
# Cache redis konfigurasi aplikasi dan environment
APP_SUPERVISOR_REDIS_URL=
# Cara komunikasi command aplikasi
APP_COMMAND_ADPATER=redis
# Redis komunikasi command aplikasi
APP_COMMAND_REDIS_URL=
# Identifier environment
ENVIRONMENT_NAME=
# URL akses environment
ENVIRONMENT_URL=
# URL proxy akses environment
ENVIRONMENT_PROXY_URL=
```

### Contoh Docker Compose

Contoh berikut menunjukkan solusi deployment campuran multi-environment dengan container Docker sebagai unit runtime, men-deploy satu aplikasi entry point dan dua aplikasi worker secara bersamaan melalui Docker Compose.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Manual Penggunaan

Operasi manajemen dasar aplikasi tidak berbeda dengan mode shared memory, silakan merujuk ke [Mode Shared Memory](./local.md). Bagian ini terutama memperkenalkan konten terkait konfigurasi multi-environment.

### List Environment

Setelah deployment selesai, masuk ke halaman "Application Supervisor" di aplikasi entry point. Anda dapat melihat list environment kerja yang telah terdaftar di tab "Environment". Termasuk informasi seperti identifier environment, versi aplikasi worker, URL akses, dan status. Aplikasi worker melaporkan heartbeat setiap 2 menit untuk memastikan ketersediaan environment.

![](https://static-docs.nocobase.com/202512291830371.png)

### Pembuatan Aplikasi

Saat membuat aplikasi, Anda dapat memilih satu hingga beberapa environment runtime, untuk menentukan ke aplikasi worker mana aplikasi tersebut akan di-deploy. Biasanya, disarankan memilih satu environment saja. Hanya saat aplikasi worker telah melakukan [pemisahan service](/cluster-mode/services-splitting), perlu men-deploy aplikasi yang sama ke beberapa environment runtime untuk mencapai pembagian beban atau isolasi kemampuan, baru memilih beberapa environment.

![](https://static-docs.nocobase.com/202512291835086.png)

### List Aplikasi

Halaman list aplikasi akan menampilkan environment runtime saat ini dan informasi status setiap aplikasi. Jika aplikasi di-deploy di beberapa environment, akan menampilkan beberapa status running. Aplikasi yang sama di beberapa environment dalam kondisi normal akan mempertahankan status terpadu, perlu kontrol startup dan stop secara terpadu.

![](https://static-docs.nocobase.com/202512291842216.png)

### Startup Aplikasi

Karena saat startup aplikasi mungkin akan menulis data inisialisasi ke database, untuk menghindari race condition pada multi-environment, aplikasi yang di-deploy di beberapa environment akan diantrekan saat startup.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy Akses Aplikasi

Aplikasi worker dapat diakses melalui proxy melalui sub-path `/apps/:appName/admin` aplikasi entry point.

![](https://static-docs.nocobase.com/202601082154230.png)

Jika aplikasi di-deploy di beberapa environment, perlu menentukan environment target proxy access.

![](https://static-docs.nocobase.com/202601082155146.png)

Secara default, alamat proxy access menggunakan alamat akses aplikasi worker, sesuai dengan environment variable `ENVIRONMENT_URL`. Pastikan alamat tersebut dapat diakses di environment jaringan tempat aplikasi entry point berada. Jika perlu menggunakan alamat proxy access yang berbeda, dapat di-override melalui environment variable `ENVIRONMENT_PROXY_URL`.
