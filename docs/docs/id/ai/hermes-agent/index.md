---
title: "Hermes Agent: Asisten NocoBase yang Semakin Memahami Anda"
description: "Integrasikan Hermes Agent ke NocoBase, melalui memori antar-sesi dan penyimpanan Skills otomatis, biarkan AI semakin memahami sistem bisnis Anda."
keywords: "Hermes Agent,NocoBase,AI Agent,Nous Research,Skills,Pembelajaran Otomatis,Self-hosted"
sidebar: false
---

:::warning Konten dalam Penulisan

Konten halaman ini masih dalam penulisan, beberapa bagian mungkin tidak lengkap atau berubah.

:::

# Hermes Agent: Asisten NocoBase yang Semakin Memahami Anda

[Hermes Agent](https://github.com/nousresearch/hermes-agent) adalah AI Agent open source self-hosted — ia akan secara otomatis menyimpan setiap operasi sukses sebagai dokumen Skills yang dapat digunakan kembali, semakin dipakai semakin memahami sistem Anda. Setelah diintegrasikan dengan NocoBase, Anda tidak hanya dapat menggunakan bahasa natural untuk membangun dan mengelola sistem, tetapi juga dapat membuatnya secara bertahap mempelajari kebiasaan dan preferensi bisnis Anda.

<!-- Diperlukan satu screenshot terminal atau percakapan Lark Hermes Agent mengoperasikan NocoBase -->

## Apa itu Hermes Agent

Hermes Agent dikembangkan oleh Nous Research (35.7k Star di GitHub), dengan filosofi inti "semakin lama digunakan, semakin pintar". Berbeda dengan AI Agent lainnya, Hermes memiliki mekanisme pembelajaran loop tertutup yang lengkap:

- **Memori antar-sesi** — Berbasis pencarian full-text dan ringkasan LLM, dapat menelusuri konteks percakapan dari minggu sebelumnya
- **Penyimpanan Skills otomatis** — Setelah berhasil menyelesaikan tugas kompleks, secara otomatis membuat dokumen Skills yang dapat digunakan kembali
- **Peningkatan diri berkelanjutan** — Skills terus dioptimalkan dalam penggunaan berulang, semakin dipakai semakin akurat
- **Dukungan 400+ model** — Kompatibel dengan penyedia LLM arus utama, tidak terikat pada model tertentu

Hermes mendukung 8 platform termasuk Lark, Telegram, Discord, Slack, dan dapat juga digunakan langsung di terminal.

:::tip Tips

Hermes Agent berjalan di server Anda sendiri, semua data dan memori disimpan secara lokal, cocok untuk skenario yang memiliki persyaratan keamanan data.

:::

## Mengapa Memilih Hermes Agent

Jika Anda sedang memilih AI Agent mana yang akan digunakan untuk mengoperasikan NocoBase, berikut adalah skenario yang paling cocok untuk Hermes:

- **Memelihara sistem yang sama dalam jangka panjang** — Mekanisme memori Hermes membuatnya semakin memahami bisnis Anda, tidak perlu menjelaskan konteks dari awal setiap kali
- **Tim memiliki kebutuhan self-hosted** — Data sepenuhnya lokal, tidak melalui layanan cloud pihak ketiga
- **Membutuhkan alur operasi yang terstandarisasi** — Dokumen Skills yang disimpan otomatis oleh Hermes dapat menjadi manual operasi tim
- **Memilih operasi terminal** — Hermes mendukung interaksi CLI secara native, cocok untuk tim teknis sehari-hari

## Prinsip Koneksi

Hermes Agent berkolaborasi dengan NocoBase dengan cara berikut:

```
Anda (Lark / Telegram / Terminal / ...)
  │
  └─→ Hermes Agent
        │
        ├── NocoBase Skills (membuat Agent memahami sistem konfigurasi NocoBase)
        │
        ├── NocoBase CLI (menjalankan operasi pembuatan, modifikasi, deployment, dll)
        │
        └── Memori & Dokumen Skills (disimpan otomatis, terus digunakan kembali)
              │
              └─→ Layanan NocoBase (sistem bisnis Anda)
```

Berbeda dengan Agent lainnya, Hermes akan memperbarui memori dan dokumen Skills miliknya setelah setiap operasi. Informasi ini disimpan secara lokal, dan secara otomatis digunakan kembali dalam operasi selanjutnya.

## Prasyarat

Sebelum memulai, pastikan Anda telah menyiapkan lingkungan berikut:

- Satu server yang menjalankan Hermes Agent (Linux / macOS, Python 3.10+)
- Node.js >= 22 (untuk menjalankan NocoBase CLI dan Skills)
- Jika sudah memiliki instance NocoBase, **karena kemampuan AI berkembang dengan cepat, saat ini hanya versi beta terbaru yang mendukung pengalaman lengkap, dengan persyaratan versi minimum >= 2.1.0-beta.20, sangat disarankan untuk memperbarui ke versi terbaru.**

Instalasi Hermes hanya memerlukan satu baris perintah:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

:::warning Perhatian

Hermes Agent memerlukan deployment dan pemeliharaan sendiri. Jika Anda ingin pengalaman tanpa konfigurasi langsung pakai, Anda dapat mempertimbangkan [OpenClaw](../openclaw/index.md) (deployment Lark sekali klik) atau [WorkBuddy](../workbuddy/index.md) (hosting Tencent).

:::

## Mulai Cepat

### Instalasi AI Sekali Klik

Salin prompt di bawah ini ke Hermes Agent, ia akan secara otomatis menyelesaikan instalasi NocoBase CLI, inisialisasi, dan konfigurasi lingkungan:

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

<!-- TODO: Susun 5-8 pertanyaan umum. Misalnya: di mana file memori disimpan, cara migrasi ke server baru, model apa yang didukung, cara menghapus memori yang salah, apa perbedaan Hermes dengan OpenClaw, dll -->

## Tautan Terkait

- [NocoBase CLI](../quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
- [NocoBase Skills](../../ai-builder/index.md#nocobase-skills) — Paket pengetahuan domain yang dapat dipasang ke AI Agent
- [Mulai Cepat Pembangunan AI](../../ai-builder/index.md) — Bangun aplikasi NocoBase dari nol dengan AI
- [Hermes Agent GitHub](https://github.com/nousresearch/hermes-agent) — Kode sumber dan dokumentasi Hermes Agent
- [OpenClaw + NocoBase](../openclaw/index.md) — AI Agent open source paling populer di dunia, deployment Lark sekali klik
- [WorkBuddy + NocoBase](../workbuddy/index.md) — Kontrol jarak jauh NocoBase dari WeCom, Lark, DingTalk multi-platform
