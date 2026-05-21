---
title: "Operasikan NocoBase dengan Codex, Membangun & Mengembangkan Sekaligus"
description: "Integrasikan asisten pemrograman AI resmi OpenAI Codex ke NocoBase, gunakan bahasa natural untuk mengoperasikan sistem bisnis Anda melalui Skills dan CLI."
keywords: "Codex,OpenAI,NocoBase,AI Agent,Skills,CLI,bahasa natural"
sidebar: false
---

:::warning Konten dalam Penulisan

Konten halaman ini masih dalam penulisan, beberapa bagian mungkin tidak lengkap atau berubah.

:::

# Operasikan NocoBase dengan Codex, Membangun & Mengembangkan Sekaligus

[Codex](https://github.com/openai/codex) adalah asisten pemrograman AI resmi yang dirilis OpenAI — berjalan di terminal, dapat membaca/menulis kode, menjalankan perintah, membantu Anda menyelesaikan berbagai tugas mulai dari coding hingga pembangunan sistem. Setelah diintegrasikan dengan NocoBase, Anda dapat menggunakan bahasa natural untuk membuat tabel data, membangun halaman, mengonfigurasi Workflow, dan dengan dukungan seri model GPT membangun sistem bisnis dengan cepat.

<!-- Diperlukan satu screenshot Codex mengoperasikan NocoBase di terminal -->

## Apa itu Codex

Codex adalah AI Agent berbentuk CLI yang dirilis OpenAI, didukung oleh seri model GPT (termasuk o3, o4-mini, dll). Ia berjalan di lingkungan sandbox lokal, dapat menjalankan kode dan perintah dengan aman. Karakteristik utama:

- **Didukung seri GPT** — Berbasis model terbaru OpenAI, ahli dalam pembuatan kode dan perencanaan tugas
- **Eksekusi sandbox** — Menjalankan perintah dalam sandbox terisolasi, aman dan terkontrol
- **Pemahaman multimodal** — Mendukung berbagai input seperti teks, gambar, dapat memahami layout UI di screenshot
- **Tingkat otonomi fleksibel** — Dari mode saran hingga mode otomatis penuh, Anda yang menentukan tingkat otonomi AI

## Mengapa Memilih Codex

Jika Anda sedang memilih AI Agent mana yang akan digunakan untuk mengoperasikan NocoBase, berikut adalah skenario yang paling cocok untuk Codex:

- **Sudah menggunakan ekosistem OpenAI** — Jika Anda memiliki langganan ChatGPT Plus/Pro atau OpenAI API Key, Codex adalah pilihan paling natural
- **Mengutamakan keamanan** — Mekanisme eksekusi sandbox memastikan operasi AI tidak akan secara tidak sengaja memengaruhi sistem Anda
- **Membutuhkan kontrol fleksibel** — Dapat mengganti tingkat otonomi sesuai kompleksitas tugas, tugas sederhana otomatis penuh, operasi sensitif perlu konfirmasi
- **Menyukai gaya model OpenAI** — Seri GPT memiliki keunggulan tersendiri dalam perencanaan tugas dan eksekusi bertahap

## Prinsip Koneksi

Codex berkolaborasi dengan NocoBase dengan cara berikut:

```
Anda (Terminal / ...)
  │
  └─→ Codex
        │
        ├── NocoBase Skills (membuat Agent memahami sistem konfigurasi NocoBase)
        │
        └── NocoBase CLI (menjalankan operasi pembuatan, modifikasi, deployment, dll)
              │
              └─→ Layanan NocoBase (sistem bisnis Anda)
```

- **NocoBase Skills** — paket pengetahuan domain, agar Codex tahu cara mengoperasikan NocoBase
- **NocoBase CLI** — tool baris perintah, untuk menjalankan operasi seperti pemodelan data, pembangunan halaman
- **Layanan NocoBase** — instance NocoBase Anda yang berjalan

## Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan lingkungan berikut:

- Telah memasang Codex (`npm install -g @openai/codex`)
- Node.js >= 22 (untuk menjalankan NocoBase CLI dan Skills)
- Jika sudah memiliki instance NocoBase, **karena kemampuan AI berkembang dengan cepat, saat ini hanya versi beta terbaru yang mendukung pengalaman lengkap, dengan persyaratan versi minimum >= 2.1.0-beta.20, sangat disarankan untuk memperbarui ke versi terbaru.**

## Mulai Cepat

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke Codex, ia akan secara otomatis menyelesaikan instalasi NocoBase CLI, inisialisasi, dan konfigurasi lingkungan:

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

<!-- TODO: Susun 5-8 pertanyaan umum. Misalnya: cara mengonfigurasi OpenAI API Key, model apa yang didukung Codex, cara memilih tingkat otonomi, apa yang harus dilakukan jika instalasi Skills gagal, dll -->

## Tautan Terkait

- [NocoBase CLI](../quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paket pengetahuan domain yang dapat dipasang ke AI Agent
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — Bangun aplikasi NocoBase dari nol dengan AI
- [Codex GitHub](https://github.com/openai/codex) — Kode sumber dan dokumentasi Codex
- [Claude Code + NocoBase](../claude-code/index.md) — Asisten pemrograman AI resmi Anthropic
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent terminal open source, mendukung 75+ model
