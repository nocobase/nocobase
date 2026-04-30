---
title: 'Keamanan & Audit'
description: 'Pelajari metode autentikasi, strategi kontrol Permission, praktik yang direkomendasikan, dan cara melacak setiap catatan operasi saat AI Agent membangun NocoBase.'
keywords: 'Pembangunan AI,Keamanan,Permission,Autentikasi,Token,OAuth,Catatan Operasi,Audit'
---

# Keamanan & Audit

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

Saat Pengguna menggunakan AI Agent untuk mengoperasikan NocoBase melalui [NocoBase CLI](../ai/quick-start.md), perlu memberikan perhatian khusus pada autentikasi, kontrol Permission, dan audit trail, untuk memastikan batas operasi yang jelas dan proses yang dapat dilacak.

## Autentikasi

AI Agent terhubung ke NocoBase, terutama memiliki dua metode autentikasi:

- **Autentikasi API key**: Menghasilkan API Key melalui Plugin [API keys](/auth-verification/api-keys/index.md), mengonfigurasinya ke lingkungan CLI, request selanjutnya langsung menggunakannya untuk mengakses API
- **Autentikasi OAuth**: Menyelesaikan satu kali autentikasi login OAuth melalui browser, kemudian mengakses API dengan identitas Pengguna saat ini

Kedua metode dapat digunakan dengan perintah `nb`, perbedaannya terletak pada sumber identitas, skenario aplikasi, dan strategi kontrol risiko yang berbeda.

### Autentikasi API key

API key terutama digunakan untuk tugas otomatisasi, scripting, dan jangka panjang, contohnya:

- Membuat AI Agent menyinkronkan data secara terjadwal
- Sering memanggil `nb api` di lingkungan pengembangan
- Menjalankan jenis tugas pembangunan yang jelas dan stabil dengan role tetap

Alur dasar sebagai berikut:

1. Aktifkan Plugin API keys di NocoBase, dan buat API Key
2. Ikat role khusus untuk API Key ini, bukan langsung mengikat Permission lengkap dari `root` atau administrator
3. Gunakan `nb env add` untuk menyimpan alamat API dan Token ke lingkungan CLI

Contohnya:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

Setelah konfigurasi selesai, AI Agent dapat menjalankan panggilan API melalui lingkungan ini:

```bash
nb api resource list --env local --resource users
```

Cara ini stabil, cocok untuk otomatisasi, dan tidak mengharuskan Pengguna login ulang setiap kali. Selama Token tidak kedaluwarsa, pemegangnya dapat terus mengakses sistem dengan Permission role yang terikat, oleh karena itu harus diperhatikan secara khusus:

- Token hanya mengikat role khusus
- Hanya disimpan di lingkungan CLI yang diperlukan
- Rotasi berkala, jangan menggunakan "tidak pernah kedaluwarsa" sebagai opsi default
- Segera hapus dan buat ulang saat dicurigai bocor

Untuk penjelasan umum lebih lanjut dapat merujuk ke [Panduan Keamanan NocoBase](../security/guide.md).

### Autentikasi OAuth

OAuth terutama digunakan untuk tugas yang dijalankan dengan identitas Pengguna login saat ini, contohnya:

- Membuat AI membantu administrator saat ini melakukan penyesuaian konfigurasi sekali pakai
- Perlu mengaitkan operasi ke Pengguna login yang jelas
- Tidak ingin menyimpan Token Permission tinggi dalam jangka panjang

Alur dasar sebagai berikut:

1. Tambahkan lingkungan CLI terlebih dahulu, pilih metode autentikasi `oauth`
2. Jalankan `nb env auth`
3. Browser membuka halaman autentikasi, login dan menyelesaikan autentikasi
4. CLI menyimpan informasi autentikasi, request `nb api` selanjutnya mengakses NocoBase dengan identitas Pengguna saat ini
5. Jika Pengguna memiliki beberapa role, role dapat ditentukan melalui `--role`

Contohnya:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` akan memulai alur login browser. Setelah berhasil, CLI akan menyimpan informasi autentikasi ke konfigurasi lingkungan saat ini, kemudian dapat melanjutkan membuat AI Agent memanggil `nb api`.

Pada implementasi default saat ini:

- Validitas access Token OAuth adalah **10 menit**
- Validitas refresh Token OAuth adalah **30 hari**

CLI akan, saat access Token mendekati kedaluwarsa, memprioritaskan menggunakan refresh Token untuk me-refresh sesi secara otomatis; jika refresh Token sudah kedaluwarsa, tidak tersedia, atau server tidak mengembalikan refresh Token, perlu menjalankan `nb env auth` ulang.

Karakteristik OAuth adalah request biasanya dijalankan dengan konteks Pengguna login saat ini dan role-nya, catatan audit juga lebih mudah dikorespondensikan ke pelaku operasi aktual. Cara ini lebih cocok untuk operasi yang melibatkan partisipasi manusia dan memerlukan konfirmasi identitas.

### Praktik yang Direkomendasikan

Direkomendasikan memilih berdasarkan prinsip berikut:

- **Tugas pengembangan, testing, otomatisasi**: Prioritaskan API key, namun harus mengikat role khusus
- **Lingkungan production, partisipasi manusia, perlu atribusi identitas yang kuat**: Prioritaskan OAuth
- **Operasi berisiko tinggi**: Meskipun secara teknis dapat menggunakan Token, disarankan beralih ke OAuth, dan dijalankan setelah Pengguna dengan Permission yang sesuai menyelesaikan autentikasi

Jika tidak ada persyaratan yang jelas, dapat ditangani dengan prinsip default berikut:

- **Default menggunakan OAuth**
- **Hanya saat secara jelas membutuhkan otomatisasi, tanpa pengawasan, atau eksekusi batch, baru menggunakan API key**

## Kontrol Permission

AI Agent sendiri tidak memiliki "Permission tambahan", apa yang dapat dilakukannya sepenuhnya tergantung pada identitas dan role yang digunakan saat ini.

Yang berarti:

- Saat mengakses dengan API key, batas Permission ditentukan oleh role yang diikat Token ini
- Saat mengakses dengan OAuth, batas Permission ditentukan oleh Pengguna login saat ini dan role saat ini

AI tidak akan melewati sistem ACL NocoBase. Jika sebuah role tidak memiliki Permission untuk mengonfigurasi tabel data, Field, halaman, atau Plugin tertentu, AI Agent meskipun mengetahui perintah yang sesuai, tidak akan dapat berhasil menjalankannya.

### Role dan Strategi Permission

Direkomendasikan menyiapkan role tersendiri untuk AI Agent, bukan menggunakan kembali role administrator yang sudah ada.

Role ini biasanya hanya perlu membuka Permission dalam cakupan berikut:

- Tabel data mana yang diizinkan untuk dioperasikan
- Action mana yang diizinkan untuk dijalankan, misalnya melihat, membuat, memperbarui, menghapus
- Apakah diizinkan mengakses halaman atau menu tertentu
- Apakah diizinkan masuk ke pengaturan sistem, manajemen Plugin, konfigurasi Permission, dan area berisiko tinggi lainnya

Misalnya, Anda dapat membuat role `ai_builder_editor`, hanya mengizinkannya:

- Mengelola tabel data terkait CRM
- Mengedit halaman tertentu
- Memicu sebagian Workflow
- Tidak mengizinkan modifikasi Permission role
- Tidak mengizinkan mengaktifkan, menonaktifkan, memasang Plugin
- Tidak mengizinkan menghapus tabel data kunci

Jika perlu membuat AI membantu mengonfigurasi Permission, dapat dikombinasikan dengan [Konfigurasi Permission](./acl.md), namun tetap disarankan agar batas Permission ditentukan secara manual terlebih dahulu.

### Prinsip Permission Minimum

Prinsip Permission minimum sangat penting dalam skenario Pembangunan AI, dapat menggunakan praktik berikut:

1. Pertama buat role khusus untuk AI
2. Awalnya hanya membuka Permission lihat
3. Berdasarkan tugas secara bertahap menambahkan Permission yang diperlukan seperti membuat, mengedit
4. Pertahankan kontrol manusia untuk operasi berisiko tinggi seperti penghapusan, modifikasi Permission, manajemen Plugin

Misalnya:

- AI untuk input konten, hanya perlu Permission lihat dan buat tabel data target
- AI untuk pembangunan halaman, hanya perlu Permission halaman terkait dan konfigurasi UI
- AI untuk pemodelan data, hanya berikan Permission modifikasi struktur tabel di lingkungan testing, jangan langsung berikan ke lingkungan production

Tidak disarankan langsung mengikat role `root`, `admin`, atau yang memiliki kemampuan konfigurasi sistem global ke AI Agent. Praktik ini meskipun deployment-nya sederhana, akan secara signifikan memperluas permukaan paparan Permission.

## Log

Dalam skenario Pembangunan AI, log digunakan untuk mendukung audit trail operasi dan lokalisasi masalah.

Fokus pada dua jenis log berikut:

- **Log request**: Mencatat informasi seperti path, metode, status code, durasi, dan sumber request dari request antarmuka
- **Log audit**: Mencatat subjek pelaksana, objek operasi, hasil, dan metadata terkait dari operasi resource kunci

Saat memulai request melalui `nb api`, CLI akan secara otomatis menyertakan request header `x-request-source: cli`, server dapat mengenali request ini berasal dari CLI.

### Log Request

Log request digunakan untuk mencatat informasi panggilan antarmuka, termasuk path request, status response, durasi, dan tanda sumber.

File log biasanya berada di:

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

Pada skenario panggilan `nb api`, log request akan menyertakan:

- `req.header.x-request-source`

Berdasarkan ini dapat membedakan request CLI dengan request browser biasa.

Untuk penjelasan direktori dan field log request, dapat merujuk ke [Log Server NocoBase](../log-and-monitor/logger/index.md).

### Log Audit

Log audit digunakan untuk mencatat subjek pelaksana, resource target, hasil eksekusi, dan informasi request terkait dari operasi kunci.

Untuk operasi yang sudah masuk ke cakupan audit, log akan mencatat:

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

Misalnya, saat AI memanggil `collections:apply`, `fields:apply`, atau operasi tulis lain yang sudah mengaktifkan audit melalui CLI, log audit akan mencatat `x-request-source: cli`, memudahkan untuk membedakan operasi UI dengan operasi yang dimulai CLI.

Untuk penjelasan detail tentang log audit, dapat merujuk ke [Log Audit](../security/audit-logger/index.md).

## Saran Keamanan

Berikut adalah beberapa saran praktik yang lebih cocok untuk skenario Pembangunan AI:

- Jangan langsung mengikat role `root`, `admin`, atau konfigurasi sistem global ke AI Agent
- Buat role khusus untuk AI Agent, dan pisahkan batas Permission berdasarkan tugas
- API key di-rotasi secara berkala, hindari penggunaan jangka panjang Token Permission tinggi yang sama
- Validasi pemodelan data, struktur halaman, dan perubahan Workflow di lingkungan testing terlebih dahulu, baru disinkronkan ke lingkungan production
- Aktifkan dan periksa secara berkala log request dan log audit, untuk memastikan operasi kunci dapat dilacak
- Untuk operasi berisiko tinggi seperti menghapus data, memodifikasi Permission, mengaktifkan/menonaktifkan Plugin, menyesuaikan konfigurasi sistem, disarankan dijalankan setelah konfirmasi manual
- Jika AI perlu berjalan dalam jangka panjang, prioritaskan memisahkannya menjadi beberapa lingkungan dengan Permission rendah, hindari penggunaan terpusat di satu lingkungan dengan Permission tinggi

## Tautan Terkait

- [Mulai Cepat Pembangunan AI](./index.md) — Instalasi dan persiapan lingkungan
- [Manajemen Lingkungan](./env-bootstrap) — Pemeriksaan lingkungan, penambahan lingkungan, dan diagnostik masalah
- [Konfigurasi Permission](./acl.md) — Mengonfigurasi role, kebijakan Permission, dan penilaian risiko
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [Panduan Keamanan NocoBase](../security/guide.md) — Saran konfigurasi keamanan yang lebih komprehensif
- [Log Server NocoBase](../log-and-monitor/logger/index.md) — Penjelasan direktori dan field log request
- [Log Audit](../security/audit-logger/index.md) — Penjelasan field catatan audit dan penggunaan
- [NocoBase MCP](../ai/mcp/index.md) — Menghubungkan AI Agent melalui protokol MCP
