:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/multi-app/multi-app/remote).
:::

pkg: '@nocobase/plugin-app-supervisor'

# Mode Multi-Lingkungan

## Pendahuluan

Mode multi-aplikasi memori bersama (shared memory) memiliki keuntungan yang jelas dalam penyebaran dan operasional, namun seiring dengan meningkatnya jumlah aplikasi dan kompleksitas bisnis, instansi tunggal mungkin secara bertahap menghadapi masalah seperti persaingan sumber daya dan penurunan stabilitas. Untuk skenario seperti ini, pengguna dapat mengadopsi solusi penyebaran hibrida multi-lingkungan untuk mendukung kebutuhan bisnis yang lebih kompleks.

Dalam mode ini, sistem menyebarkan satu aplikasi entri sebagai pusat manajemen dan penjadwalan terpadu, serta menyebarkan beberapa instansi NocoBase sebagai lingkungan berjalan aplikasi yang independen, yang bertanggung jawab untuk menjalankan aplikasi bisnis yang sebenarnya. Setiap lingkungan terisolasi satu sama lain dan bekerja secara kolaboratif, sehingga secara efektif mendistribusikan tekanan instansi tunggal dan secara signifikan meningkatkan stabilitas, skalabilitas, serta kemampuan isolasi kesalahan sistem.

Pada tingkat penyebaran, lingkungan yang berbeda dapat berjalan dalam proses independen, disebarkan sebagai kontainer Docker yang berbeda, atau dalam bentuk beberapa Deployment Kubernetes, yang mampu beradaptasi secara fleksibel dengan berbagai skala dan arsitektur infrastruktur.

## Penyebaran

Dalam mode penyebaran hibrida multi-lingkungan:

- Aplikasi entri (Supervisor) bertanggung jawab untuk manajemen terpadu informasi aplikasi dan lingkungan.
- Aplikasi kerja (Worker) berfungsi sebagai lingkungan berjalan bisnis yang sebenarnya.
- Konfigurasi aplikasi dan lingkungan di-cache melalui Redis.
- Sinkronisasi instruksi dan status antara aplikasi entri dan aplikasi kerja bergantung pada komunikasi Redis.

Saat ini fitur pembuatan lingkungan belum tersedia, setiap aplikasi kerja perlu disebarkan secara manual dan dikonfigurasi dengan informasi lingkungan yang sesuai sebelum dapat dikenali oleh aplikasi entri.

### Dependensi Arsitektur

Sebelum melakukan penyebaran, harap siapkan layanan berikut:

- Redis
  - Men-cache konfigurasi aplikasi dan lingkungan.
  - Sebagai saluran komunikasi perintah antara aplikasi entri dan aplikasi kerja.

- Database
  - Layanan database yang perlu dihubungkan oleh aplikasi entri dan aplikasi kerja.

### Aplikasi Entri (Supervisor)

Aplikasi entri berfungsi sebagai pusat manajemen terpadu, bertanggung jawab untuk pembuatan, mulai, henti aplikasi, dan penjadwalan lingkungan, serta sebagai proxy akses aplikasi.

Penjelasan konfigurasi variabel lingkungan aplikasi entri:

```bash
# Mode aplikasi
APP_MODE=supervisor
# Metode penemuan aplikasi
APP_DISCOVERY_ADAPTER=remote
# Metode manajemen proses aplikasi
APP_PROCESS_ADAPTER=remote
# Redis cache konfigurasi aplikasi dan lingkungan
APP_SUPERVISOR_REDIS_URL=
# Metode komunikasi perintah aplikasi
APP_COMMAND_ADPATER=redis
# Redis komunikasi perintah aplikasi
APP_COMMAND_REDIS_URL=
```

### Aplikasi Kerja (Worker)

Aplikasi kerja berfungsi sebagai lingkungan berjalan bisnis yang sebenarnya, bertanggung jawab untuk menampung dan menjalankan instansi aplikasi NocoBase yang spesifik.

Penjelasan konfigurasi variabel lingkungan aplikasi kerja:

```bash
# Mode aplikasi
APP_MODE=worker
# Metode penemuan aplikasi
APP_DISCOVERY_ADAPTER=remote
# Metode manajemen proses aplikasi
APP_PROCESS_ADAPTER=local
# Redis cache konfigurasi aplikasi dan lingkungan
APP_SUPERVISOR_REDIS_URL=
# Metode komunikasi perintah aplikasi
APP_COMMAND_ADPATER=redis
# Redis komunikasi perintah aplikasi
APP_COMMAND_REDIS_URL=
# Identitas lingkungan
ENVIRONMENT_NAME=
# URL akses lingkungan
ENVIRONMENT_URL=
# URL akses proxy lingkungan
ENVIRONMENT_PROXY_URL=
```

### Contoh Docker Compose

Contoh berikut menunjukkan solusi penyebaran hibrida multi-lingkungan dengan kontainer Docker sebagai unit berjalan, yang menyebarkan satu aplikasi entri dan dua aplikasi kerja secara bersamaan melalui Docker Compose.

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

## Panduan Pengguna

Operasi manajemen dasar aplikasi tidak berbeda dengan mode memori bersama, silakan merujuk ke [Mode Memori Bersama](./local.md). Bagian ini terutama memperkenalkan konten yang terkait dengan konfigurasi multi-lingkungan.

### Daftar Lingkungan

Setelah penyebaran selesai, masuk ke halaman "App Supervisor" di aplikasi entri, Anda dapat melihat daftar lingkungan kerja yang telah terdaftar di tab "Lingkungan". Ini mencakup identitas lingkungan, versi aplikasi kerja, URL akses, dan status. Aplikasi kerja melaporkan detak jantung (heartbeat) setiap 2 menit untuk memastikan ketersediaan lingkungan.

![](https://static-docs.nocobase.com/202512291830371.png)

### Membuat Aplikasi

Saat membuat aplikasi, Anda dapat memilih satu atau lebih lingkungan berjalan untuk menentukan di aplikasi kerja mana aplikasi tersebut akan disebarkan. Dalam keadaan normal, disarankan untuk memilih satu lingkungan saja. Pilih beberapa lingkungan hanya jika aplikasi kerja telah melakukan [pemisahan layanan](/cluster-mode/services-splitting) dan perlu menyebarkan aplikasi yang sama ke beberapa lingkungan berjalan untuk mencapai pembagian beban atau isolasi kemampuan.

![](https://static-docs.nocobase.com/202512291835086.png)

### Daftar Aplikasi

Halaman daftar aplikasi akan menampilkan lingkungan berjalan saat ini dan informasi status untuk setiap aplikasi. Jika aplikasi disebarkan di beberapa lingkungan, maka akan menampilkan beberapa status berjalan. Dalam kondisi normal, aplikasi yang sama di beberapa lingkungan akan mempertahankan status yang seragam dan perlu dikontrol secara terpadu untuk mulai dan berhenti.

![](https://static-docs.nocobase.com/202512291842216.png)

### Menjalankan Aplikasi

Karena startup aplikasi mungkin menulis data inisialisasi ke database, untuk menghindari kondisi balapan (race condition) di bawah multi-lingkungan, aplikasi yang disebarkan di beberapa lingkungan akan mengantre untuk dijalankan saat startup.

![](https://static-docs.nocobase.com/202512291841727.png)

### Akses Proxy Aplikasi

Aplikasi kerja dapat diakses melalui proxy menggunakan sub-jalur `/apps/:appName/admin` dari aplikasi entri.

![](https://static-docs.nocobase.com/202601082154230.png)

Jika aplikasi disebarkan di beberapa lingkungan, lingkungan target untuk akses proxy perlu ditentukan.

![](https://static-docs.nocobase.com/202601082155146.png)

Secara default, alamat akses proxy menggunakan alamat akses aplikasi kerja yang sesuai dengan variabel lingkungan `ENVIRONMENT_URL`, pastikan alamat tersebut dapat diakses dalam lingkungan jaringan tempat aplikasi entri berada. Jika perlu menggunakan alamat akses proxy yang berbeda, ini dapat ditimpa melalui variabel lingkungan `ENVIRONMENT_PROXY_URL`.