# Bab 1: Mengenal NocoBase — Berjalan dalam 5 Menit

Dalam seri ini, kita akan memulai dari nol dan membangun **Sistem Tiket (HelpDesk) yang sangat sederhana** menggunakan NocoBase. Seluruh sistem hanya membutuhkan **2 [tabel data](/data-sources/data-modeling/collection)**, tanpa menulis satu baris kode pun, untuk merealisasikan pengiriman tiket, manajemen kategori, pelacakan perubahan, kontrol izin, dan [dashboard](/data-visualization) data.

Bab ini pertama-tama akan men-deploy NocoBase dengan satu klik melalui [Docker](/get-started/installation/docker), menyelesaikan login pertama, memahami perbedaan antara [mode konfigurasi dan mode penggunaan](/get-started/how-nocobase-works), dan melihat gambaran umum sistem tiket.


## 1.1 Apa itu NocoBase

Pernahkah Anda mengalami skenario seperti ini:

- Tim membutuhkan sistem internal untuk mengelola bisnis, tetapi software di pasaran selalu kurang sedikit
- Mencari tim development untuk kustomisasi terlalu mahal dan lambat, sementara kebutuhan terus berubah
- Menggunakan Excel untuk menyiasati, data semakin berantakan, kolaborasi semakin sulit

**NocoBase lahir untuk menyelesaikan masalah ini.** Ia adalah **platform pengembangan AI no-code** yang open source dan sangat mudah diperluas. Anda dapat membangun sistem bisnis Anda sendiri melalui konfigurasi dan drag-and-drop, tanpa perlu menulis kode.

Dibandingkan dengan tool no-code lainnya, NocoBase memiliki beberapa konsep inti:

- **Model Data Driven**: Definisikan [Data Source](/data-sources) dan struktur data terlebih dahulu, kemudian gunakan [Block](/interface-builder/blocks) untuk menampilkan data, akhirnya gunakan [Action](/interface-builder/actions) untuk memproses data — antarmuka dan data benar-benar terpisah
- **WYSIWYG**: Halaman adalah kanvas, klik tempat yang ingin diubah, intuitif seperti membangun halaman Notion
- **Semuanya adalah Plugin**: Semua fitur adalah [Plugin](/development/plugin), seperti WordPress, instalasi sesuai kebutuhan, ekstensi yang fleksibel
- **AI Terintegrasi dengan Bisnis**: [AI Employee](/ai-employees/quick-start) bawaan dapat mengeksekusi tugas analisis, terjemahan, input, dan benar-benar terintegrasi dengan workflow Anda
- **Open Source + Deployment Privat**: Kode inti sepenuhnya open source, data sepenuhnya berada di server Anda sendiri


## 1.2 Instalasi NocoBase

NocoBase mendukung berbagai metode instalasi, kita memilih yang paling sederhana yaitu **[Instalasi Docker](/get-started/installation/docker)**.

### Prasyarat

Komputer Anda perlu menginstal [Docker](https://docs.docker.com/get-docker/) dan Docker Compose, dan pastikan layanan Docker sedang berjalan. Windows / Mac / Linux semuanya didukung.

### Langkah 1: Download File Konfigurasi

Buka terminal (Windows menggunakan PowerShell, Mac menggunakan Terminal), jalankan:

```bash
# Buat direktori proyek dan masuk
mkdir my-project && cd my-project

# Download docker-compose.yml (default menggunakan PostgreSQL)
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **Database lain?** Ganti `postgres` di link di atas dengan `mysql` atau `mariadb`.
> Anda juga dapat memilih versi yang berbeda: `latest` (versi stabil), `beta` (versi uji coba), `alpha` (versi pengembangan), lihat detail di [Dokumentasi Instalasi Resmi](https://docs.nocobase.com/get-started/installation/docker).
>
> | Database | Link Download |
> |--------|---------|
> | PostgreSQL (direkomendasikan) | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### Langkah 2: Jalankan

```bash
# Tarik image
docker compose pull

# Jalankan di background (saat pertama kali dijalankan, instalasi akan dilakukan otomatis)
docker compose up -d

# Lihat log untuk memastikan startup berhasil
docker compose logs -f app
```

Jika Anda melihat output baris berikut, berarti startup berhasil:

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### Langkah 3: Login

Buka browser dan akses `http://localhost:13000`, gunakan akun default untuk login:

- **Akun**: `admin@nocobase.com`
- **Password**: `admin123`

> Setelah login pertama kali, segera ubah password default.


## 1.3 Mengenal Antarmuka

Setelah berhasil login, Anda akan melihat antarmuka awal yang bersih. Jangan terburu-buru, mari kita kenali dua konsep paling penting terlebih dahulu.

### Mode Konfigurasi vs Mode Penggunaan

Antarmuka NocoBase memiliki dua mode:

| Mode | Penjelasan | Siapa yang Menggunakan |
|------|------|------|
| **Mode Penggunaan** | Antarmuka sehari-hari yang digunakan pengguna biasa | Semua orang |
| **Mode Konfigurasi** | Mode desain untuk membangun dan menyesuaikan antarmuka | Administrator |

Cara beralih: klik tombol **"[Konfigurasi UI](/get-started/how-nocobase-works) (UI Editor)"** di pojok kanan atas (ikon highlighter).

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

Setelah mengaktifkan mode konfigurasi, Anda akan menemukan banyak elemen pada halaman dikelilingi oleh **frame highlight oranye** — ini menunjukkan bahwa mereka dapat dikonfigurasi. Setiap elemen yang dapat dikonfigurasi memiliki ikon kecil di pojok kanan atas, klik untuk melakukan pengaturan.

Mari kita lihat efeknya pada sistem demo:

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

Seperti yang ditunjukkan pada gambar di atas: menu, toolbar Action tabel, bagian bawah halaman semuanya menampilkan tip oranye, klik untuk melakukan opsi pembuatan langkah selanjutnya.

> **Ingat aturan ini**: Di NocoBase, jika ingin memodifikasi tampilan, masuk ke mode konfigurasi, temukan ikon kecil di pojok kanan atasnya, lalu klik.

### Struktur Dasar Antarmuka

Antarmuka NocoBase terdiri dari tiga area:

```
┌──────────────────────────────────────────┐
│            Bilah Navigasi Atas             │
├──────────┬───────────────────────────────┤
│          │                               │
│  Menu    │         Area Konten            │
│  Kiri    │    (Tempat menempatkan Block)   │
│ (group)  │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **Bilah Navigasi Atas**: Menempatkan menu level pertama, beralih antar modul yang berbeda
- **Menu Kiri (group)**: Jika menu grup, akan berisi menu level kedua ini, mengorganisir hierarki halaman
- **Area Konten**: Bagian utama halaman, menempatkan berbagai **Block** untuk menampilkan dan mengoperasikan data

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

Saat ini masih kosong, tidak masalah — mulai dari bab berikutnya, kita akan mulai mengisinya.


## 1.4 Apa yang Akan Kita Bangun

Dalam tutorial selanjutnya, kita akan membangun **Sistem Tiket IT** langkah demi langkah, yang dapat melakukan:

- ✅ Pengiriman tiket: [Pengguna](/users-permissions/user) mengisi judul, deskripsi, memilih kategori dan prioritas
- ✅ Daftar tiket: filter berdasarkan status, kategori, dengan jelas
- ✅ Kontrol [izin](/users-permissions/acl/role): pengguna biasa hanya melihat tiket sendiri, administrator melihat semua
- ✅ Dashboard data: statistik real-time distribusi dan tren tiket
- ✅ Log operasi data (bawaan)

Seluruh sistem hanya membutuhkan **2 tabel data**:

| Tabel Data | Fungsi | Jumlah Field Kustom |
|--------|------|--------|
| Kategori Tiket | Kategori tiket (seperti: masalah jaringan, gangguan software) | 2 |
| Tiket | Tabel inti, mencatat setiap tiket | 7-8 |

Tidak salah, hanya 2 tabel. Kemampuan umum seperti pengguna, izin, manajemen file, bahkan departemen, email, log operasi, semuanya sudah disediakan oleh Plugin yang ada di NocoBase, tidak perlu menemukan kembali roda. Kita hanya perlu fokus pada data bisnis kita sendiri.


## Ringkasan

Pada bab ini kita telah menyelesaikan:

1. Memahami apa itu NocoBase — sebuah platform no-code open source
2. Menginstal dan menjalankan NocoBase dengan satu klik menggunakan Docker
3. Mengenal dua mode antarmuka (mode konfigurasi/mode penggunaan) dan layout dasar
4. Melihat blueprint sistem tiket yang akan kita bangun

**Bab berikutnya**, kita akan mulai praktik — masuk ke manajemen data source, membuat tabel data pertama kita. Ini adalah kerangka seluruh sistem dan kemampuan inti dari NocoBase.

Sampai jumpa di bab berikutnya!

## Sumber Daya Terkait

- [Detail Instalasi Docker](/get-started/installation/docker) — Penjelasan opsi instalasi lengkap dan variabel lingkungan
- [Persyaratan Sistem](/get-started/system-requirements) — Persyaratan lingkungan hardware dan software
- [Cara Kerja NocoBase](/get-started/how-nocobase-works) — Konsep inti seperti Data Source, Block, Action, dan lainnya
