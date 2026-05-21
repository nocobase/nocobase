---
title: "OpenCode + NocoBase: Cara Membangun NocoBase yang Open Source, Bebas, Tanpa Ikatan"
description: "Integrasikan asisten pemrograman AI open source OpenCode ke NocoBase, pilih model dengan bebas, gunakan bahasa natural untuk mengoperasikan sistem bisnis Anda."
keywords: "OpenCode,NocoBase,AI Agent,Open Source,Multi-model,Skills,CLI,bahasa natural"
sidebar: false
---

:::warning Konten dalam Penulisan

Konten halaman ini masih dalam penulisan, beberapa bagian mungkin tidak lengkap atau berubah.

:::

# OpenCode + NocoBase: Cara Membangun NocoBase yang Open Source, Bebas, Tanpa Ikatan

[OpenCode](https://github.com/opencode-ai/opencode) adalah AI Agent terminal open source — mendukung 75+ model (Claude, GPT, Gemini, DeepSeek, dll), tidak terikat pada vendor mana pun, Anda dapat dengan bebas memilih model yang paling sesuai. Setelah diintegrasikan dengan NocoBase, Anda dapat menggunakan bahasa natural untuk membuat tabel data, membangun halaman, mengonfigurasi Workflow, sambil tetap mempertahankan kontrol penuh atas pemilihan model dan biaya.

<!-- Diperlukan satu screenshot OpenCode mengoperasikan NocoBase di terminal -->

## Apa itu OpenCode

OpenCode dikembangkan oleh Anomaly Innovations (140k+ Star di GitHub), dengan posisi "AI Agent terminal yang tidak terikat vendor". Ia ditulis dengan Go, menyediakan antarmuka TUI yang indah. Karakteristik utama:

- **Dukungan 75+ model** — Claude, GPT, Gemini, DeepSeek, model lokal, dll, dapat diganti dengan bebas
- **Tanpa vendor lock-in** — Bawa API Key sendiri, bayar sesuai pemakaian, tidak perlu langganan tambahan
- **Arsitektur multi-Agent** — Dilengkapi 5 peran Agent bawaan: Build, Plan, Review, Debug, Docs
- **Privasi diutamakan** — Tidak menyimpan kode atau konteks, semua data tetap di lokal

OpenCode juga mendukung integrasi editor seperti VS Code, JetBrains, Zed, Neovim, dan juga memiliki aplikasi desktop mandiri.

## Mengapa Memilih OpenCode

Jika Anda sedang memilih AI Agent mana yang akan digunakan untuk mengoperasikan NocoBase, berikut adalah skenario yang paling cocok untuk OpenCode:

- **Tidak ingin terikat pada satu model** — Hari ini pakai Claude, besok pindah ke GPT, lusa coba DeepSeek, satu tool tuntas
- **Mengutamakan kontrol biaya** — Bawa API Key sendiri bayar sesuai pemakaian, mendukung penggunaan langganan ChatGPT Plus yang ada
- **Memiliki persyaratan privasi** — Kode dan konteks tidak melalui pihak ketiga, mendukung model lokal
- **Menyukai kustomisasi tingkat tinggi** — Konfigurasi YAML untuk perilaku Agent kustom, memenuhi kebutuhan khusus tim

## Prinsip Koneksi

OpenCode berkolaborasi dengan NocoBase dengan cara berikut:

```
Anda (Terminal / VS Code / JetBrains / ...)
  │
  └─→ OpenCode
        │
        ├── NocoBase Skills (membuat Agent memahami sistem konfigurasi NocoBase)
        │
        └── NocoBase CLI (menjalankan operasi pembuatan, modifikasi, deployment, dll)
              │
              └─→ Layanan NocoBase (sistem bisnis Anda)
```

- **NocoBase Skills** — paket pengetahuan domain, agar OpenCode tahu cara mengoperasikan NocoBase
- **NocoBase CLI** — tool baris perintah, untuk menjalankan operasi seperti pemodelan data, pembangunan halaman
- **Layanan NocoBase** — instance NocoBase Anda yang berjalan

## Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan lingkungan berikut:

- Telah memasang OpenCode ([panduan instalasi](https://opencode.ai/docs/))
- Node.js >= 22 (untuk menjalankan NocoBase CLI dan Skills)
- Jika sudah memiliki instance NocoBase, **karena kemampuan AI berkembang dengan cepat, saat ini hanya versi beta terbaru yang mendukung pengalaman lengkap, dengan persyaratan versi minimum >= 2.1.0-beta.20, sangat disarankan untuk memperbarui ke versi terbaru.**

## Mulai Cepat

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke OpenCode, ia akan secara otomatis menyelesaikan instalasi NocoBase CLI, inisialisasi, dan konfigurasi lingkungan:

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

<!-- TODO: Susun 5-8 pertanyaan umum. Misalnya: cara mengonfigurasi API Key untuk berbagai model, cara mengganti model, cara menggunakan model lokal, apa yang harus dilakukan jika instalasi Skills gagal, dll -->

## Tautan Terkait

- [NocoBase CLI](../quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paket pengetahuan domain yang dapat dipasang ke AI Agent
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — Bangun aplikasi NocoBase dari nol dengan AI
- [Dokumentasi Resmi OpenCode](https://opencode.ai/docs/) — Panduan penggunaan lengkap OpenCode
- [Claude Code + NocoBase](../claude-code/index.md) — Asisten pemrograman AI resmi Anthropic
- [Codex + NocoBase](../codex/index.md) — Asisten pemrograman AI resmi OpenAI
