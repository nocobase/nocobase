:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Lanjutan

## Pendahuluan

Model bahasa besar (LLM) utama memiliki kemampuan untuk menggunakan alat. Plugin AI employee dilengkapi dengan beberapa alat umum yang dapat digunakan oleh model bahasa besar.

Keterampilan yang diatur pada halaman pengaturan AI employee adalah alat yang tersedia untuk digunakan oleh model bahasa besar.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Mengatur Keterampilan

Buka halaman konfigurasi plugin AI employee, lalu klik tab `AI employees` untuk masuk ke halaman manajemen AI employee.

Pilih AI employee yang ingin Anda atur keterampilannya, lalu klik tombol `Edit` untuk masuk ke halaman pengeditan AI employee.

Pada tab `Skills`, klik tombol `Add Skill` untuk menambahkan keterampilan bagi AI employee saat ini.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Pengenalan Keterampilan

### Frontend

Grup Frontend memungkinkan AI employee untuk berinteraksi dengan komponen *frontend*.

- Keterampilan `Form filler` memungkinkan AI employee untuk mengisi kembali data formulir yang dihasilkan ke dalam formulir yang ditentukan pengguna.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Keterampilan dalam grup Data modeling memberikan kemampuan kepada AI employee untuk memanggil API internal NocoBase untuk pemodelan data.

- `Intent Router` (Router Intent), menentukan apakah pengguna ingin memodifikasi struktur **koleksi** atau membuat struktur **koleksi** baru.
- `Get collection names` (Dapatkan Nama Koleksi), mendapatkan semua nama **koleksi** yang sudah ada dalam sistem.
- `Get collection metadata` (Dapatkan Metadata Koleksi), mendapatkan informasi struktur **koleksi** yang ditentukan.
- `Define collections` (Definisikan Koleksi), memungkinkan AI employee untuk membuat **koleksi** dalam sistem.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` memberikan kemampuan kepada AI employee untuk menjalankan **alur kerja**. **Alur kerja** yang dikonfigurasi dengan `Trigger type` sebagai `AI employee event` di dalam **plugin** **alur kerja** akan tersedia di sini sebagai keterampilan untuk digunakan oleh AI employee.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Keterampilan di bawah grup Code Editor terutama memungkinkan AI employee untuk berinteraksi dengan editor kode.

- `Get code snippet list` (Dapatkan Daftar Cuplikan Kode), mendapatkan daftar cuplikan kode yang telah diatur sebelumnya.
- `Get code snippet content` (Dapatkan Konten Cuplikan Kode), mendapatkan konten cuplikan kode yang ditentukan.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Lain-lain

- `Chart generator` (Generator Bagan), memberikan kemampuan kepada AI employee untuk menghasilkan bagan dan menampilkannya langsung dalam percakapan.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)