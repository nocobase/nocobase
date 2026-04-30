---
title: "OpenClaw + NocoBase: AI Agent Terpopuler Membantu Anda"
description: "Integrasikan AI Agent open source paling populer di dunia OpenClaw ke NocoBase, gunakan bahasa natural untuk mengoperasikan sistem bisnis Anda melalui Skills dan CLI."
keywords: "OpenClaw,NocoBase,AI Agent,Skills,CLI,Lark,bahasa natural"
sidebar: false
---

:::warning Konten dalam Penulisan

Konten halaman ini masih dalam penulisan, beberapa bagian mungkin tidak lengkap atau berubah.

:::

# OpenClaw + NocoBase: AI Agent Terpopuler Membantu Anda

[OpenClaw](https://github.com/openclaw/openclaw) adalah framework AI Agent open source paling populer di dunia — bukan hanya chatting, tetapi juga benar-benar mampu menjalankan tugas. Setelah diintegrasikan dengan NocoBase, Anda dapat menggunakan bahasa natural untuk membuat tabel data, membangun halaman, mengonfigurasi Workflow, bahkan membiarkannya berjalan secara otonom 24/7, terus memelihara sistem bisnis Anda.

<!-- Diperlukan satu screenshot percakapan OpenClaw mengoperasikan NocoBase di Lark -->

## Apa itu OpenClaw

OpenClaw adalah framework AI Agent open source yang dibuat oleh pengembang Peter Steinberger, salah satu proyek AI Agent paling populer saat ini secara global (300k+ Star di GitHub). Posisinya adalah "asisten AI yang mampu mengerjakan tugas". Berbeda dengan tool percakapan seperti ChatGPT dan Claude, OpenClaw memiliki empat karakteristik utama:

- **Kemampuan eksekusi** — Setelah menerima instruksi bahasa natural, secara otomatis menyelesaikan tugas, bukan hanya memberi saran
- **Memori antar-sesi** — Dapat mengingat preferensi dan kebiasaan penggunaan Anda, semakin dipakai semakin lancar
- **Ekosistem Skills** — Memperluas kemampuan dengan menginstal Skills, seperti "mengajarkan keterampilan baru" kepada asisten
- **Berjalan 24/7** — Mendukung scheduled task, laporan proaktif, tidak perlu Anda terus mengawasi

OpenClaw mendukung 26+ platform seperti Lark, Telegram, Discord, dan lainnya, Anda dapat berdialog langsung dengannya di tools kerja sehari-hari. Pengguna Lark juga dapat melakukan deployment sekali klik, tanpa memerlukan dasar teknis apa pun.

## Mengapa Memilih OpenClaw

Jika Anda sedang memilih AI Agent mana yang akan digunakan untuk mengoperasikan NocoBase, berikut adalah skenario yang paling cocok untuk OpenClaw:

- **Membutuhkan pengoperasian tanpa hambatan** — Pengguna Lark dapat melakukan deployment sekali klik, tanpa perlu menyiapkan server sendiri
- **Tim menggunakan Lark untuk bekerja** — OpenClaw terintegrasi mendalam dengan Lark, pengalaman seperti pembuatan pesan streaming, @bot grup chat sangat lancar
- **Membutuhkan online 24/7** — OpenClaw dideploy di cloud, tidak terpengaruh oleh status komputer lokal
- **Mengutamakan ekosistem komunitas** — OpenClaw memiliki komunitas Skills terbesar, selain NocoBase juga banyak skills lain yang tersedia

## Prinsip Koneksi

OpenClaw berkolaborasi dengan NocoBase dengan cara berikut:

```
Anda (Lark / Telegram / ...)
  │
  └─→ OpenClaw Agent
        │
        ├── NocoBase Skills (membuat Agent memahami sistem konfigurasi NocoBase)
        │
        └── NocoBase CLI (menjalankan operasi pembuatan, modifikasi, deployment, dll)
              │
              └─→ Layanan NocoBase (sistem bisnis Anda)
```

- **NocoBase Skills** — paket pengetahuan domain, agar OpenClaw tahu cara mengoperasikan NocoBase
- **NocoBase CLI** — tool baris perintah, untuk menjalankan operasi seperti pemodelan data, pembangunan halaman
- **Layanan NocoBase** — instance NocoBase Anda yang berjalan

## Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan lingkungan berikut:

- OpenClaw Agent yang sudah dideploy ([deployment Lark sekali klik](https://openclaw.feishu.cn) atau deployment lokal)
- Node.js >= 22 (untuk menjalankan NocoBase CLI dan Skills)
- Jika sudah memiliki instance NocoBase, **karena kemampuan AI berkembang dengan cepat, saat ini hanya versi beta terbaru yang mendukung pengalaman lengkap, dengan persyaratan versi minimum >= 2.1.0-beta.20, sangat disarankan untuk memperbarui ke versi terbaru.**

:::warning Perhatian

Saat memasang Skills pihak ketiga, harap perhatikan keamanan — prioritaskan menggunakan Skills dari sumber resmi atau tepercaya, hindari memasang skills komunitas yang belum diaudit.

:::

## Mulai Cepat

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke OpenClaw, ia akan secara otomatis menyelesaikan instalasi NocoBase CLI, inisialisasi, dan konfigurasi lingkungan:

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

<!-- TODO: Susun 5-8 pertanyaan umum. Misalnya: apa yang harus dilakukan jika instalasi Skills gagal, cara memperbarui versi Skills, model apa yang didukung OpenClaw, cara melakukan rollback jika operasi error, dll -->

## Tautan Terkait

- [NocoBase CLI](../quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paket pengetahuan domain yang dapat dipasang ke AI Agent
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — Bangun aplikasi NocoBase dari nol dengan AI
- [Panduan Deployment OpenClaw Lark](https://openclaw.feishu.cn) — Deployment OpenClaw ke Lark sekali klik
- [Hermes Agent + NocoBase](../hermes-agent/index.md) — Secara otomatis menyimpan Skills, semakin dipakai semakin memahami sistem bisnis Anda
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Kontrol jarak jauh NocoBase dari WeCom, Lark, DingTalk multi-platform
