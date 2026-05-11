---
title: "Bebaskan Tangan Anda, Gerakkan NocoBase dengan WorkBuddy"
description: "Kontrol jarak jauh NocoBase melalui WorkBuddy Tencent, mendukung integrasi multi-platform seperti WeCom, Lark, DingTalk."
keywords: "WorkBuddy,NocoBase,AI Agent,Tencent,WeCom,Lark,DingTalk,Kontrol Jarak Jauh"
sidebar: false
---

:::warning Konten dalam Penulisan

Konten halaman ini masih dalam penulisan, beberapa bagian mungkin tidak lengkap atau berubah.

:::

# Bebaskan Tangan Anda, Gerakkan NocoBase dengan WorkBuddy

[WorkBuddy](https://www.codebuddy.cn) adalah AI Agent profesional all-scenario yang dirilis Tencent — jelaskan kebutuhan dengan satu kalimat, ia dapat secara mandiri merencanakan langkah dan mengeksekusi. Setelah diintegrasikan dengan NocoBase, Anda dapat mengontrol jarak jauh sistem bisnis Anda di platform seperti WeCom, Lark, DingTalk, tanpa perlu membuka browser dapat menyelesaikan operasi pengelolaan harian.

<!-- Diperlukan satu screenshot percakapan WorkBuddy mengoperasikan NocoBase di WeCom -->

## Apa itu WorkBuddy

WorkBuddy adalah "platform kerja AI Agent profesional all-scenario" yang dirilis Tencent. Berbeda dengan tool dialog AI biasa, setelah menerima tugas WorkBuddy akan secara otomatis memecah, merencanakan, dan mengeksekusi, akhirnya menyerahkan hasil yang dapat diverifikasi — tanpa Anda perlu membimbingnya langkah demi langkah.

Karakteristik utama:

- **Perencanaan dan eksekusi mandiri** — Setelah menerima tugas secara otomatis memecah langkah, mengeksekusi satu per satu, menyerahkan hasil yang lengkap
- **Integrasi multi-platform** — Mendukung platform kerja domestik utama seperti WeCom, Lark, DingTalk, QQ
- **20+ Skills bawaan** — Pembuatan dokumen, analisis data, pembuatan PPT, editing email, dan lainnya siap pakai
- **Operasi file lokal** — Dapat membaca dan memproses file lokal yang Anda otorisasi

Sederhananya, tool AI tradisional memberi saran agar Anda yang mengerjakan, WorkBuddy langsung membantu menyelesaikannya.

| Dialog AI Tradisional | WorkBuddy |
| --------------------- | ----------------------- |
| Hanya bisa dialog, memberi saran | Dapat benar-benar mengeksekusi tugas |
| Perlu mengoperasikan file secara manual | Otomatis mengoperasikan file lokal |
| Tugas sederhana satu langkah | Tugas kompleks multi-langkah dipecah otomatis |
| Output balasan teks | Menyerahkan hasil yang dapat diverifikasi |

## Mengapa Memilih WorkBuddy

Jika Anda sedang memilih AI Agent mana yang akan digunakan untuk mengoperasikan NocoBase, berikut adalah skenario yang paling cocok untuk WorkBuddy:

- **Tim menggunakan WeCom / Lark / DingTalk** — WorkBuddy mendukung platform kerja domestik terluas, cakupan terbesar
- **Membutuhkan kontrol NocoBase dari mobile** — Kelola sistem kapan saja saat di luar, tidak terbatas pada perangkat
- **Berharap langsung pakai** — Produk Tencent, dilengkapi 20+ Skills bawaan, ambang konfigurasi rendah
- **Fokus pada otomatisasi tugas** — WorkBuddy ahli dalam memecah dan mengeksekusi tugas multi-langkah secara otomatis, cocok untuk operasional dan pengelolaan harian

## Prinsip Koneksi

WorkBuddy berkolaborasi dengan NocoBase dengan cara berikut:

```
Anda (WeCom / Lark / DingTalk / ...)
  │
  └─→ WorkBuddy
        │
        ├── NocoBase Skills (membuat Agent memahami sistem konfigurasi NocoBase)
        │
        └── NocoBase CLI (menjalankan operasi pembuatan, modifikasi, deployment, dll)
              │
              └─→ Layanan NocoBase (sistem bisnis Anda)
```

Anda mengirim instruksi di platform yang didukung apa pun, WorkBuddy di backend menyelesaikan operasi terhadap NocoBase melalui Skills dan CLI, hasil di-push secara real-time kembali ke jendela percakapan Anda.

## Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan lingkungan berikut:

- Akun WorkBuddy ([entry pendaftaran](https://www.codebuddy.cn))
- Node.js >= 22 (untuk menjalankan NocoBase CLI dan Skills)
- Jika sudah memiliki instance NocoBase, **karena kemampuan AI berkembang dengan cepat, saat ini hanya versi beta terbaru yang mendukung pengalaman lengkap, dengan persyaratan versi minimum >= 2.1.0-beta.20, sangat disarankan untuk memperbarui ke versi terbaru.**

:::warning Perhatian

WorkBuddy saat ini sedang dalam iterasi cepat, beberapa fungsi mungkin berubah. Disarankan mengikuti [dokumentasi resmi WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) untuk mendapatkan informasi terbaru.

:::

## Mulai Cepat

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke WorkBuddy, ia akan secara otomatis menyelesaikan instalasi NocoBase CLI, inisialisasi, dan konfigurasi lingkungan:

```
Bantu saya memasang NocoBase CLI dan menyelesaikan inisialisasi: https://docs.nocobase.com/cn/ai/ai-quick-start.md (silakan akses langsung konten link)
```

### Instalasi Manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

Browser akan secara otomatis membuka halaman konfigurasi visual, memandu Anda untuk memasang NocoBase Skills, mengonfigurasi database, dan memulai aplikasi. Untuk langkah-langkah detail silakan lihat [Mulai Cepat](../quick-start.md).

Setelah instalasi selesai, jalankan `nb env list` untuk mengonfirmasi status run lingkungan:

```bash
nb env list
```

Konfirmasi bahwa output berisi lingkungan yang telah dikonfigurasi, beserta status berjalannya.

## Pertanyaan Umum

<!-- TODO: Susun 5-8 pertanyaan umum. Misalnya: platform apa yang didukung WorkBuddy, berapa kuota gratis, cara menangani kegagalan operasi, dapatkah beberapa orang berbagi WorkBuddy yang sama untuk mengontrol NocoBase yang sama, dll -->

## Tautan Terkait

- [NocoBase CLI](../quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paket pengetahuan domain yang dapat dipasang ke AI Agent
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — Bangun aplikasi NocoBase dari nol dengan AI
- [Dokumentasi Resmi WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/Overview) — Panduan penggunaan lengkap WorkBuddy
- [OpenClaw + NocoBase](../openclaw/index.md) — AI Agent open source paling populer di dunia, deployment Lark sekali klik
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Secara otomatis menyimpan Skills, semakin dipakai semakin memahami sistem bisnis Anda
