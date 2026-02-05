---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Ekspor Pro

## Pendahuluan

Plugin Ekspor Pro menyediakan fitur yang ditingkatkan di atas fungsionalitas ekspor standar.

## Instalasi

Plugin ini bergantung pada plugin Manajemen Tugas Asinkron. Anda perlu mengaktifkan plugin Manajemen Tugas Asinkron sebelum menggunakannya.

## Peningkatan Fitur

- Mendukung operasi ekspor asinkron, dieksekusi dalam thread terpisah, untuk mengekspor data dalam jumlah besar.
- Mendukung ekspor lampiran.

## Panduan Pengguna

### Konfigurasi Mode Ekspor

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Pada tombol ekspor, Anda dapat mengonfigurasi mode ekspor. Ada tiga mode ekspor yang dapat dipilih:

- Otomatis: Mode ekspor ditentukan oleh volume data. Jika jumlah data kurang dari 1000 baris (atau 100 baris untuk ekspor lampiran), ekspor sinkron akan digunakan. Jika jumlah data lebih dari 1000 baris (atau 100 baris untuk ekspor lampiran), ekspor asinkron akan digunakan.
- Sinkron: Menggunakan ekspor sinkron, yang berjalan di thread utama. Mode ini cocok untuk data skala kecil. Mengekspor data dalam jumlah besar dalam mode sinkron dapat menyebabkan sistem terblokir, macet, dan tidak dapat menangani permintaan pengguna lain.
- Asinkron: Menggunakan ekspor asinkron, yang berjalan di thread latar belakang terpisah dan tidak akan memblokir operasi sistem saat ini.

### Ekspor Asinkron

Setelah memulai ekspor, proses akan berjalan di thread latar belakang terpisah tanpa memerlukan konfigurasi manual dari pengguna. Di antarmuka pengguna, setelah memulai operasi ekspor, tugas ekspor yang sedang berjalan akan ditampilkan di sudut kanan atas, menunjukkan progres tugas secara real-time.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Setelah ekspor selesai, Anda dapat mengunduh file hasil ekspor dari tugas ekspor.

#### Ekspor Konkuren
Banyaknya tugas ekspor konkuren dapat dipengaruhi oleh konfigurasi server, yang menyebabkan respons sistem melambat. Oleh karena itu, disarankan agar pengembang sistem mengonfigurasi jumlah maksimum tugas ekspor konkuren (standar adalah 3). Ketika jumlah tugas konkuren melebihi batas yang dikonfigurasi, tugas baru akan masuk dalam antrean.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Cara konfigurasi konkurensi: Variabel lingkungan ASYNC_TASK_MAX_CONCURRENCY=jumlah_konkurensi

Berdasarkan pengujian komprehensif dengan berbagai konfigurasi dan kompleksitas data, jumlah konkurensi yang direkomendasikan adalah:
- CPU 2-core, jumlah konkurensi 3.
- CPU 4-core, jumlah konkurensi 5.

#### Tentang Performa
Jika Anda menemukan bahwa proses ekspor sangat lambat (lihat referensi di bawah), kemungkinan ada masalah performa yang disebabkan oleh struktur koleksi.

| Karakteristik Data | Tipe Indeks | Volume Data | Durasi Ekspor |
|---------|---------|--------|---------|
| Tanpa Kolom Relasi | Kunci Primer / Batasan Unik | 1 juta | 3～6 menit |
| Tanpa Kolom Relasi | Indeks Biasa | 1 juta | 6～10 menit |
| Tanpa Kolom Relasi | Indeks Komposit (non-unik) | 1 juta | 30 menit |
| Kolom Relasi<br>(Satu-ke-Satu, Satu-ke-Banyak,<br>Banyak-ke-Satu, Banyak-ke-Banyak) | Kunci Primer / Batasan Unik | 500 ribu | 15～30 menit | Kolom relasi mengurangi performa |

Untuk memastikan ekspor yang efisien, kami merekomendasikan Anda untuk:
1. Koleksi harus memenuhi kondisi berikut:

| Tipe Kondisi | Kondisi Wajib | Catatan Lain |
|---------|------------------------|------|
| Struktur Koleksi (penuhi setidaknya satu) | Memiliki Kunci Primer<br>Memiliki Batasan Unik<br>Memiliki Indeks (unik, biasa, komposit) | Prioritas: Kunci Primer > Batasan Unik > Indeks
| Karakteristik Kolom | Kunci Primer / Batasan Unik / Indeks (salah satunya) harus memiliki karakteristik yang dapat diurutkan, seperti: ID auto-increment, Snowflake ID, UUID v1, timestamp, angka, dll.<br>(Catatan: Kolom yang tidak dapat diurutkan seperti UUID v3/v4/v5, string biasa, dll., akan memengaruhi performa) | Tidak Ada |

2. Kurangi jumlah kolom yang tidak perlu diekspor, terutama kolom relasi (masalah performa yang disebabkan oleh kolom relasi masih dalam tahap optimasi).
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Jika ekspor masih lambat setelah memenuhi kondisi di atas, Anda dapat menganalisis log atau memberikan masukan kepada tim resmi.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule): Menampilkan/menyembunyikan tombol secara dinamis;
- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): Mengedit judul, tipe, dan ikon tombol;