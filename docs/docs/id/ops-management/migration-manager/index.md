---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Manajer Migrasi

## Pendahuluan

Manajer Migrasi membantu Anda memindahkan konfigurasi aplikasi dari satu lingkungan aplikasi ke lingkungan lainnya. Fokus utamanya adalah pada migrasi "konfigurasi aplikasi". Jika Anda memerlukan migrasi data secara menyeluruh, kami sarankan untuk menggunakan fitur pencadangan dan pemulihan dari '[Manajer Cadangan](../backup-manager/index.mdx)'.

## Instalasi

Manajer Migrasi bergantung pada [plugin Manajer Cadangan](../backup-manager/index.mdx). Pastikan plugin tersebut sudah terinstal dan diaktifkan.

## Proses dan Prinsip

Manajer Migrasi memindahkan tabel dan data dari database utama berdasarkan aturan migrasi yang ditentukan, dari satu aplikasi ke aplikasi lainnya. Perlu diperhatikan bahwa ini tidak memigrasikan data dari database eksternal atau sub-aplikasi.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Aturan Migrasi

### Aturan Bawaan

Manajer Migrasi dapat memigrasikan semua tabel di database utama dan mendukung lima aturan bawaan berikut:

- **Hanya Skema**: Hanya memigrasikan struktur (skema) tabel—tidak ada data yang disisipkan atau diperbarui.
- **Timpa (hapus dan sisipkan ulang)**: Menghapus semua catatan yang ada dari tabel database target, lalu menyisipkan data baru.
- **Sisipkan atau Perbarui (Upsert)**: Memeriksa apakah setiap catatan ada (berdasarkan kunci utama). Jika ada, catatan tersebut diperbarui; jika tidak, catatan tersebut disisipkan.
- **Sisipkan-abaikan**: Menyisipkan catatan baru, tetapi jika catatan sudah ada (berdasarkan kunci utama), penyisipan diabaikan (tidak ada pembaruan yang terjadi).
- **Lewati**: Melewatkan pemrosesan untuk tabel sepenuhnya (tidak ada perubahan struktur, tidak ada migrasi data).

**Catatan tambahan:**

- "Timpa," "Sisipkan atau Perbarui," dan "Sisipkan-abaikan" semuanya juga menyinkronkan perubahan struktur tabel.
- Jika tabel menggunakan ID auto-increment sebagai kunci utamanya, atau jika tidak memiliki kunci utama, aturan `Sisipkan atau Perbarui` maupun `Sisipkan-abaikan` tidak dapat diterapkan.
- `Sisipkan atau Perbarui` dan `Sisipkan-abaikan` mengandalkan kunci utama untuk menentukan apakah catatan sudah ada.

### Desain Rinci

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Antarmuka Konfigurasi

Konfigurasi aturan migrasi

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Aktifkan aturan independen

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Pilih aturan independen dan tabel yang akan diproses oleh aturan independen saat ini

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Berkas Migrasi

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Membuat Migrasi Baru

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Menjalankan Migrasi

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Pemeriksaan variabel lingkungan aplikasi (pelajari lebih lanjut tentang [Variabel Lingkungan](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Jika ada yang hilang, sebuah pop-up akan muncul untuk meminta pengguna memasukkan variabel lingkungan baru yang diperlukan di sini, lalu melanjutkan.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Log Migrasi

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Rollback

Sebelum migrasi dijalankan, aplikasi saat ini akan secara otomatis dicadangkan. Jika migrasi gagal atau hasilnya tidak sesuai harapan, Anda dapat melakukan rollback menggunakan [Manajer Cadangan](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)