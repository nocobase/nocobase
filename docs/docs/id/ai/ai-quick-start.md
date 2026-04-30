---
title: "Panduan Instalasi AI Agent"
description: "Panduan instalasi dan konfigurasi NocoBase CLI untuk AI Agent, mencakup langkah lengkap pemeriksaan lingkungan, instalasi, inisialisasi, dan validasi."
keywords: "NocoBase CLI,AI Agent,Instalasi,Claude Code,Codex,Cursor,Skills"
sidebar: false
---

# Panduan Instalasi AI Agent

Halaman ini adalah panduan instalasi dan inisialisasi NocoBase CLI yang ditujukan untuk AI Agent (seperti Claude Code, Codex, Cursor, Copilot, dll).

Jika Anda adalah pengguna manusia, silakan lihat [Mulai Cepat](./quick-start.md).

## Step 1: Periksa Lingkungan Prasyarat

Konfirmasi pengguna telah memasang dependensi berikut:

- **Node.js >= 22** (jalankan `node -v` untuk memeriksa)
- **Yarn 1.x** (jalankan `yarn -v` untuk memeriksa). Jika tidak ada, pasang melalui `npm install -g yarn`
- **Git** (jalankan `git --version` untuk memeriksa). Jika tidak ada, pasang melalui [situs resmi Git](https://git-scm.com/)
- **Docker** (jika pengguna perlu memasang NocoBase dengan cara Docker). Jalankan `docker -v` untuk memeriksa, jika tidak ada dan pengguna perlu menggunakan Docker, arahkan pengguna untuk memasang melalui [situs resmi Docker](https://www.docker.com/get-started/), jika tidak lewati.

Jika lingkungan prasyarat tidak terpenuhi, beri tahu pengguna bahwa mereka perlu memasang dependensi yang hilang terlebih dahulu, dan berikan link instalasi serta panduan instalasi sederhana. Setelah memastikan semua lingkungan prasyarat terpenuhi, lanjutkan ke langkah berikutnya untuk memasang CLI.

## Step 2: Pasang CLI

Jika lingkungan pengguna sudah memasang NocoBase CLI (jalankan `nb --version` untuk memeriksa), langsung lanjutkan ke langkah berikutnya. Jika belum, jalankan perintah berikut untuk memasang:

```bash
npm install -g @nocobase/cli@beta
```

Jalankan `nb --version` untuk mengonfirmasi instalasi berhasil.

## Step 3: Jalankan Perintah Inisialisasi

**⚠️ Penting: Anda harus menjalankan perintah berikut dengan tepat, tidak boleh memodifikasi, mengganti, atau menghilangkan parameter `--ui`. Jangan mencoba menggunakan "mode non-interaktif" atau merangkai parameter sendiri untuk "mempercepat" proses ini — `--ui` adalah satu-satunya cara inisialisasi yang benar.**

```bash
nb init --ui
```

Perintah ini akan memulai wizard visual browser, pengguna perlu menyelesaikan semua konfigurasi di browser (termasuk metode instalasi, database, akun administrator, dll). Tugas Anda sebagai AI Agent adalah:

1. **Hanya jalankan `nb init --ui`**, tanpa menambahkan parameter tambahan apa pun
2. **Beri tahu pengguna** bahwa browser akan secara otomatis membuka halaman konfigurasi lokal, dan mereka perlu menyelesaikan konfigurasi di dalamnya
3. **Jika browser tidak dapat dibuka secara otomatis** (misalnya karena pembatasan izin sandbox), berikan URL output perintah kepada pengguna, biarkan mereka menyalin secara manual ke browser untuk membukanya
4. **Tunggu konfirmasi pengguna** bahwa konfigurasi telah selesai, baru lanjutkan ke langkah berikutnya. Perintah ini secara default memiliki batas waktu 30 menit, jangan menjalankan perintah ini berulang kali dalam batas waktu tersebut.

## Step 4: Validasi Hasil

```bash
nb env list
```

Konfirmasi bahwa output berisi lingkungan yang telah dikonfigurasi, beserta status berjalannya. Kemudian ingatkan pengguna bahwa mereka dapat membuka URL instance NocoBase yang sedang berjalan, dan login dengan akun serta password yang dikonfigurasi.

## Step 5: Selesai

Beri tahu pengguna bahwa instalasi telah selesai. Konfigurasi CLI disimpan di direktori global (default `~/.nocobase/`), AI Agent dapat mengaksesnya dari direktori mana pun, tanpa perlu masuk ke direktori kerja tertentu.
