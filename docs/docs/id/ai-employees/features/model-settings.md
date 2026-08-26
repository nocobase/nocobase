---
title: 'Konfigurasi Model AI Employee'
description: 'Konfigurasi Model AI Employee.'
keywords: 'AI Employee model settings,dedicated model,model scope,LLM service,NocoBase AI'
---

# Konfigurasi Model AI Employee

Secara default, AI Employee dapat menggunakan semua service LLM dan model yang diaktifkan. Admin dapat mengaktifkan pengaturan model khusus untuk employee tertentu dan membatasi modelnya.

## Prasyarat

- Plugin **AI Employees** sudah diaktifkan.
- Setidaknya satu service LLM sudah dikonfigurasi.
- AI Employee target sudah diaktifkan.

Untuk konfigurasi service LLM, lihat [Konfigurasi service LLM](/ai-employees/features/llm-service).

## Titik masuk

Buka `System Settings -> AI Employees -> AI employees`, buka employee yang ingin dikonfigurasi, lalu pindah ke `Model settings`.

![](https://static-docs.nocobase.com/202605121216415.png)

## Aktifkan pengaturan model khusus

Setelah mengaktifkan `Enable dedicated model configuration`, pilih model yang diizinkan di `Models`.

- Switcher model di chat hanya menampilkan model terpilih.
- Shortcut task dan node workflow hanya dapat menggunakan model terpilih.

:::info{title=Tips}
Jika pengaturan model khusus aktif tetapi tidak ada model dipilih, model yang tersedia tidak dapat ditemukan.
:::

## Nonaktifkan pengaturan model khusus

Setelah dinonaktifkan, aturan default berlaku kembali:

- Dapat menggunakan semua model LLM yang aktif.
- Jika tidak dipilih manual, sistem memakai model default global.

## Aturan resolusi model

Saat menjalankan tugas, model akhir ditentukan dengan urutan berikut:

1. Jika pengaturan model khusus aktif, tentukan model dari rentang model yang dipilih terlebih dahulu.
2. Jika request menentukan model dan model tersebut diizinkan, gunakan model itu.
3. Jika model yang ditentukan tidak diizinkan, gunakan model pertama yang diizinkan.
4. Jika pengaturan model khusus tidak aktif, prioritaskan model yang ditentukan oleh request.
5. Jika tidak ada model yang ditentukan, gunakan model default global.

## Rekomendasi

- Jika tidak bisa deploy lokal, pilih model khusus terjemahan daripada model chat umum.
- Concurrency dapat disesuaikan dengan kemampuan model untuk mengontrol throughput, waktu respons, dan biaya.

## FAQ

### Mengapa daftar model kosong?

Biasanya karena service LLM belum dikonfigurasi atau belum ada model aktif. Periksa `Enabled Models`.

### Mengapa pengguna tidak bisa berpindah ke model lain?

Jika pengaturan khusus aktif, hanya rentang model terpilih yang tersedia.

### Entry apa yang terpengaruh?

Berlaku untuk chat baru, shortcut task, node AI Employee workflow, dan task bawaan plugin. Pesan historis tidak dibuat ulang.
