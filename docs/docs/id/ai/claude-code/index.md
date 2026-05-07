---
title: "Claude Code + NocoBase: Otak AI Terkuat, Arsitek Utama NocoBase Anda"
description: "Integrasikan asisten pemrograman AI resmi Anthropic Claude Code ke NocoBase, gunakan bahasa natural untuk mengoperasikan sistem bisnis Anda melalui Skills dan CLI."
keywords: "Claude Code,NocoBase,AI Agent,Anthropic,Skills,CLI,bahasa natural"
sidebar: false
---

:::warning Konten dalam Penulisan

Konten halaman ini masih dalam penulisan, beberapa bagian mungkin tidak lengkap atau berubah.

:::

# Claude Code + NocoBase: Otak AI Terkuat, Arsitek Utama NocoBase Anda

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) adalah asisten pemrograman AI resmi dari Anthropic — berjalan langsung di terminal, dapat memahami seluruh codebase Anda, dan membantu Anda menyelesaikan berbagai tugas mulai dari coding hingga pembangunan sistem. Setelah diintegrasikan dengan NocoBase, Anda dapat menggunakan bahasa natural untuk membuat tabel data, membangun halaman, mengonfigurasi Workflow, dan menikmati pengalaman pembangunan dengan model AI yang paling kuat.

<!-- Diperlukan satu screenshot Claude Code mengoperasikan NocoBase di terminal -->

## Apa itu Claude Code

Claude Code adalah AI Agent berbentuk CLI yang dirilis Anthropic, didukung oleh seri model Claude. Ia berjalan langsung di terminal, mampu memahami konteks proyek dan menjalankan operasi. Karakteristik utama:

- **Kemampuan model puncak** — Berbasis Claude Opus / Sonnet, dengan kinerja terdepan dalam pemahaman dan pembuatan kode
- **Native terminal** — Berjalan langsung di terminal, terintegrasi mulus dengan alur kerja pengembang
- **Pemahaman proyek** — Secara otomatis memahami struktur proyek, hubungan dependensi, dan standar kode
- **Kolaborasi multi-tool** — Mendukung operasi seperti membaca/menulis file, menjalankan perintah, mencari kode

Claude Code juga mendukung integrasi IDE seperti VS Code, JetBrains, dan dapat digunakan sebagai aplikasi desktop dan aplikasi Web mandiri.

## Mengapa Memilih Claude Code

Jika Anda sedang memilih AI Agent mana yang akan digunakan untuk mengoperasikan NocoBase, berikut adalah skenario yang paling cocok untuk Claude Code:

- **Mengejar kemampuan model terkuat** — Seri model Claude unggul dalam reasoning kompleks dan pembuatan kode
- **Alur kerja harian pengembang** — Native terminal, terintegrasi mulus dengan IDE, Git, npm, dan tools Anda
- **Membutuhkan pemahaman proyek mendalam** — Claude Code akan secara otomatis menganalisis struktur proyek, memberikan saran yang sesuai dengan konteks
- **Membangun dan mengembangkan sekaligus** — Dapat membantu Anda membangun aplikasi NocoBase, juga membantu Anda mengembangkan Plugin kustom

## Prinsip Koneksi

Claude Code berkolaborasi dengan NocoBase dengan cara berikut:

```
Anda (Terminal / VS Code / JetBrains / ...)
  │
  └─→ Claude Code
        │
        ├── NocoBase Skills (membuat Agent memahami sistem konfigurasi NocoBase)
        │
        └── NocoBase CLI (menjalankan operasi pembuatan, modifikasi, deployment, dll)
              │
              └─→ Layanan NocoBase (sistem bisnis Anda)
```

- **NocoBase Skills** — paket pengetahuan domain, agar Claude Code tahu cara mengoperasikan NocoBase
- **NocoBase CLI** — tool baris perintah, untuk menjalankan operasi seperti pemodelan data, pembangunan halaman
- **Layanan NocoBase** — instance NocoBase Anda yang berjalan

## Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan lingkungan berikut:

- Telah memasang Claude Code (`npm install -g @anthropic-ai/claude-code`)
- Node.js >= 22 (untuk menjalankan NocoBase CLI dan Skills)
- Jika sudah memiliki instance NocoBase, **karena kemampuan AI berkembang dengan cepat, saat ini hanya versi beta terbaru yang mendukung pengalaman lengkap, dengan persyaratan versi minimum >= 2.1.0-beta.20, sangat disarankan untuk memperbarui ke versi terbaru.**

## Mulai Cepat

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke Claude Code, ia akan secara otomatis menyelesaikan instalasi NocoBase CLI, inisialisasi, dan konfigurasi lingkungan:

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

<!-- TODO: Susun 5-8 pertanyaan umum. Misalnya: cara mengonfigurasi API Key, model apa yang didukung Claude Code, cara menggunakannya di VS Code, apa yang harus dilakukan jika instalasi Skills gagal, dll -->

## Tautan Terkait

- [NocoBase CLI](../quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paket pengetahuan domain yang dapat dipasang ke AI Agent
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — Bangun aplikasi NocoBase dari nol dengan AI
- [Dokumentasi Resmi Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Panduan penggunaan lengkap Claude Code
- [OpenClaw + NocoBase](../openclaw/index.md) — AI Agent open source paling populer di dunia, deployment Lark sekali klik
- [Codex + NocoBase](../codex/index.md) — Asisten pemrograman AI resmi OpenAI
- [OpenCode + NocoBase](../opencode/index.md) — AI Agent terminal open source, mendukung 75+ model
