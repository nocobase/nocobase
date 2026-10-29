# NocoBase 3

> Branch ini berisi NocoBase 3. Jika Anda mencari platform no-code NocoBase 2, kunjungi [NocoBase 2](https://nocode.nocobase.com/).

[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | Bahasa Indonesia | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**Bangun sistem bisnis yang andal**

NocoBase adalah platform open source untuk membangun, menjalankan, dan terus mengembangkan sistem bisnis dengan AI. Agen menulis kode dan mengerjakan tugas, NocoBase menyediakan fondasi dan tata kelola, dan manusia yang mengambil keputusan.

[▶ Tonton demo](https://static-docs.nocobase.com/nocobase-3-id.mp4)

[Situs web](https://www.nocobase.com/id-ID/) · [Dokumentasi](https://docs.nocobase.com/) · [Mulai cepat](#quick-start) · [Komunitas](https://forum.nocobase.com/)

## Mengapa NocoBase

**AI menulis kode dengan cepat. Membangun sistem bisnis yang andal tetap tidak mudah.**

Tim Anda sudah mengembangkan dengan AI atau vibe coding. Kode tertulis cepat, tetapi masalah baru ikut muncul.

- **Fondasi dibangun dari nol**

  Meski AI yang menulis kode, izin akses, mesin alur kerja, dan persetujuan tetap sulit dirancang dari nol. Banyak kasus tepi, dan pemeliharaannya berat.

- **Arsitektur melenceng tak terkendali**

  Ganti developer, model, atau bahkan sesi, dan AI bisa berimprovisasi secara berbeda setiap kali. Sistem makin sulit dipelihara.

- **Pekerjaan paralel melampaui kapasitas review**

  Anda menangani banyak proyek dan tugas sekaligus, berpindah antara terminal dan chat, sementara agen terus mengirim perubahan. Terlalu banyak untuk ditinjau, tetapi melepas kendali terasa terlalu berisiko.

- **Pengetahuan sulit didokumentasikan dan dibagikan**

  Konteks kebutuhan, dokumen bisnis, dan pelajaran proyek tersebar di sesi chat pada komputer yang berbeda. Saat orang atau agen berganti, semuanya sulit ditemukan.

<a id="quick-start"></a>

## Mulai cepat

Memerlukan Node.js 24+ dan pnpm 11. Pengguna Windows perlu menggunakan WSL. Contoh ini menggunakan SQLite, sehingga tidak memerlukan server basis data terpisah.

### Dengan agen pemrograman

Buka agen pemrograman yang mendukung Skills di direktori kosong dan instal Skill pembuatan aplikasi:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Pilih agen Anda saat instalasi. Jika Skill baru belum dikenali, mulai sesi baru. Lalu kirim:

```text
Ikuti Skill nocobase-create-app untuk membuat dan menjalankan aplikasi NocoBase 3 di direktori kosong saat ini, menggunakan template default dan SQLite.
```

### Melalui terminal

Jalankan perintah berikut dari direktori induk tempat Anda menyimpan proyek:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Lihat [dokumentasi](https://docs.nocobase.com/) untuk petunjuk penyiapan dan panduan pengembangan lebih lanjut.

## Ekosistem NocoBase

- **[NocoBase Core](https://www.nocobase.com/id-ID/core/)**

  **Biarkan agen fokus pada logika bisnis Anda. Fondasinya sudah siap.**

  NocoBase Core adalah fondasi aplikasi open source untuk sistem bisnis yang dibangun dan dijalankan dengan AI. Izin akses, alur kerja, file, dan komponen dasar lainnya siap pakai, sehingga agen hanya membangun hal yang khas bagi bisnis Anda, di atas satu arsitektur yang konsisten.

- **[NocoBase Studio](https://www.nocobase.com/id-ID/studio/)**

  **Agen menggerakkan pekerjaan secara mandiri. Tim Anda tetap memegang kendali.**

  NocoBase Studio adalah platform tata kelola untuk manusia dan agen yang membangun perangkat lunak bersama. Studio menyatukan Claude Code, Codex, dan OpenCode menjadi satu tim agen yang menggerakkan tugas secara mandiri. Progres terlihat sekilas, dan keputusan penting tetap di tangan manusia.

- **[NocoBase Solution](https://www.nocobase.com/id-ID/solutions/)**

  **Aplikasi bisnis open source. Digerakkan AI, siap pakai.**

  NocoBase Solution adalah rangkaian aplikasi bisnis yang digerakkan agen dan dibangun di atas Core. Agen mengerjakan sebagian besar pekerjaan, manusia hanya mengambil keputusan penting.

## Komunitas dan kontribusi

- Ajukan pertanyaan dan bagikan pengalaman di [forum komunitas](https://forum.nocobase.com/).
- Laporkan bug yang dapat direproduksi dan usulkan peningkatan melalui [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Baca [dokumentasi](https://docs.nocobase.com/) untuk memahami framework dan plugin.

Kontribusi selalu diterima. Sebelum mengubah repositori ini, baca [AGENTS.md](./AGENTS.md) dan petunjuk pengembangan yang relevan.
