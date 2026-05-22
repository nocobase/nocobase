---
title: 'Lina: Engineer Lokalisasi'
description: 'Dokumentasi AI Employee NocoBase.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina: Engineer Lokalisasi

## Peran

Lina: Engineer Lokalisasi berfokus pada skenario bawaan NocoBase ini dan membantu menyelesaikan tugas terkait dengan lebih efisien.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Tips}
Lina khusus untuk skenario lokalisasi dan tidak menggunakan Skills atau Tools umum.
:::

## Skenario

- Menerjemahkan entry sistem dan plugin secara batch.
- Menerjemahkan konten collection, field, dan menu.
- Menerjemahkan hanya entry yang dipilih di tabel.

## Prasyarat

Sebelum menggunakan Lina, selesaikan konfigurasi berikut:

- Aktifkan plugin **Manajemen Lokalisasi**.
- Konfigurasikan service LLM yang tersedia dan tetapkan model default untuk Lina. Lihat [Konfigurasi Model AI Employee](/ai-employees/features/model-settings) dan [Rekomendasi model](#rekomendasi-model).
- Aktifkan bahasa target di pengaturan sistem.
- Sinkronkan entry yang akan diterjemahkan di halaman Manajemen Lokalisasi.

:::info{title=Tips}
Lina membuat tugas terjemahan untuk locale saat ini.
:::

## Konfigurasi prompt

Buka dialog edit Lina dari `System Settings -> AI Employees -> AI employees`, lalu sesuaikan prompt di `Role setting`. Prompt biasanya digunakan untuk mendefinisikan informasi domain bisnis, aturan terminologi, dan batasan output. Prompt sebaiknya tidak terlalu panjang, karena mungkin tidak cocok untuk model terjemahan khusus.

![](https://static-docs.nocobase.com/202605191351816.png)

Contoh prompt default:

```text
# Role
You are Lina, a professional localization translator for NocoBase.

# Task
Translate NocoBase localization text into the requested target language.

# Translation requirements
1. Keep the translation faithful, concise, and natural for product UI.
2. Use consistent NocoBase and software terminology.
3. Preserve placeholders, variables, HTML tags, ICU syntax, line breaks, and code-like tokens.
4. Return only the translated text. Do not explain, quote, or use Markdown.
5. If the text should not be translated, return it unchanged.
```

Terjemahan referensi dan teks yang akan diterjemahkan tidak perlu ditulis ke prompt Lina. Saat membuat tugas, sistem akan menambahkannya secara otomatis berdasarkan konten entry, bahasa target, dan konfigurasi bahasa referensi di dialog konfirmasi.

## Penggunaan

Di halaman Manajemen Lokalisasi, klik avatar Lina dan pilih cakupan tugas terjemahan AI.

### Terjemahan incremental

Hanya menerjemahkan entry yang belum memiliki terjemahan pada bahasa saat ini.

Untuk entry bawaan, jika terjemahan sudah ada di paket bahasa sistem atau plugin untuk bahasa target, entry tersebut dianggap sudah diterjemahkan meskipun belum ada record terkait di tabel terjemahan lokalisasi, dan tidak dihitung dalam terjemahan incremental.

### Terjemahan item terpilih

Pilih entry di tabel terlebih dahulu, lalu terjemahkan hanya konten yang dipilih.

Jika tidak ada entry dipilih, sistem akan meminta Anda memilih record terlebih dahulu.

### Terjemahan penuh

Menerjemahkan semua entry yang memenuhi syarat pada bahasa saat ini.

:::warning{title=Catatan}
Terjemahan penuh dapat menimpa terjemahan yang sudah ada. Pastikan bahasa target, jumlah entry, dan service model sebelum mulai.
:::

## Konfirmasi tugas

Sebelum membuat tugas, sistem menampilkan dialog konfirmasi berisi:

- Deskripsi tugas.
- Jumlah entry yang akan diterjemahkan.
- Provider yang digunakan.
- Model yang digunakan.
- Konfigurasi bahasa terjemahan referensi.

Terjemahan penuh dan terjemahan incremental juga dapat memilih cakupan terjemahan di dialog konfirmasi:

- **Semua**: memproses semua entry yang sesuai dengan kondisi tugas saat ini.
- **Entry bawaan**: entry sistem dan plugin.
- **Entry kustom**: nama route, nama collection dan field, serta konten UI.

Terjemahan item terpilih hanya memproses record yang sudah dipilih di tabel, sehingga tidak menampilkan cakupan terjemahan. Opsi ini juga hanya menampilkan satu konfigurasi bahasa referensi umum, tanpa memisahkan entry bawaan dan entry kustom.

Jika jumlah entry yang akan diterjemahkan adalah 0, sistem menampilkan pesan dan tidak membuat background task. Setelah dikonfirmasi, sistem membuat background task. Progres dapat dilihat di async tasks. Setelah selesai, terjemahan ditulis ke bahasa terkait.

![](https://static-docs.nocobase.com/202605191341968.png)

## Terjemahan referensi

Entry pendek seperti nama field, tombol, dan status menggunakan terjemahan referensi untuk meningkatkan konsistensi.

- Entry bawaan menggunakan terjemahan bahasa Mandarin sebagai referensi default dan bahasa Jepang sebagai referensi cadangan.
- Entry kustom menggunakan bahasa default sistem sebagai referensi default dan bahasa Mandarin sebagai referensi cadangan.
- Pengguna dapat menyesuaikan bahasa default dan bahasa cadangan di dialog konfirmasi tugas.
- Sistem terlebih dahulu menggunakan terjemahan referensi dalam bahasa default. Jika tidak tersedia, sistem mencoba bahasa cadangan.

Jika referensi tersedia, Lina menggunakan prompt dengan semantik seperti berikut:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Rekomendasi model

Terjemahan lokalisasi biasanya memproses banyak entry. Jika memungkinkan, gunakan model kecil khusus terjemahan yang di-deploy lokal karena model online sering memiliki limit rate, concurrency, atau token.

Jika tidak bisa deploy lokal, pilih model khusus terjemahan daripada model chat umum. Model terjemahan biasanya lebih sesuai untuk entry pendek, teks UI, dan terjemahan batch. Lina menyusun prompt employee, terjemahan referensi, dan teks yang akan diterjemahkan menjadi prompt yang dikirim ke model. Pengguna dapat menyesuaikan prompt Lina untuk mengontrol gaya dan aturan terjemahan.

Concurrency dapat disesuaikan dengan kemampuan model untuk mengontrol throughput, waktu respons, dan biaya.

Untuk praktik lengkap dengan model kecil khusus terjemahan yang di-deploy lokal, lihat [Menggunakan Lina dan HY-MT1.5-1.8B lokal untuk menerjemahkan entry lokalisasi](/ai-employees/scenarios/localization-hy-mt).

:::info{title=Tips}
Concurrency dikontrol oleh `AI_LOCALIZATION_CONCURRENCY`. Default `10`, rentang `1` sampai `20`; nilai di luar rentang memakai default.
:::

## Progres dan penanganan kegagalan

Tugas terjemahan Lina berjalan sebagai background async task dan menulis hasil per entry.

![](https://static-docs.nocobase.com/202605121235761.png)

Jika satu entry gagal, error dicatat dan task dihentikan untuk menghindari hasil yang tidak terkendali.

- Plugin AI atau Async Task Manager belum diaktifkan.
- Lina belum memiliki model yang tersedia.
- Service model tidak tersedia atau timeout.

Periksa detail async task dan log server untuk provider, model, bahasa target, ID entry, dan durasi.

## Review sebelum publish

Setelah terjemahan AI selesai, review sebelum publish:

- Entry pendek seperti menu, tombol, dan nama field sesuai konteks produk.
- Variabel, placeholder, dan tag HTML tetap terjaga.
- Terminologi bisnis konsisten.
- Publish setelah review.
