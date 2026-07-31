---
title: "Pengembangan Plugin Karyawan AI"
description: "Perkenalkan hubungan, konvensi direktori, dan jalur pembelajaran antara Alat, Keterampilan, staf AI bawaan, dan UI Alat front-end di plugin NocoBase."
keywords: "NocoBase, pengembangan plug-in karyawan AI, Alat, Keterampilan, defineAIEmployee, src/ai"
---

# Pengembangan Plugin Karyawan AI

Di NocoBase, plug-in dapat menyerahkan kemampuan bisnisnya kepada karyawan AI. Tiga titik ekstensi bertanggung jawab untuk tingkat yang berbeda:

- **Alat** — Melakukan operasi tertentu seperti menanyakan data, memanggil API, memodifikasi catatan, dll.
- **Keterampilan** — memberi tahu model kapan harus menggunakan alat dan langkah apa yang harus diambil untuk menyelesaikan tugas
- **Karyawan AI Bawaan** — Merakit profil karakter, perintah sistem, keterampilan, dan alat menjadi karyawan yang siap pakai

Secara umum, Anda tidak perlu memanggil antarmuka pendaftaran secara manual. Setelah menempatkan file di direktori plugin yang disetujui `src/ai`, NocoBase akan secara otomatis memindai dan menyelesaikan pendaftaran saat memuat plugin. Hanya ketika Alat perlu menyesuaikan kartu, pop-up, atau logika eksekusi sisi browser, Alat perlu mendaftarkan komponen front-end atau logika eksekusi yang sesuai di `src/client-v2/plugin.tsx` plugin.

Sebelum memulai, Anda perlu memastikan bahwa aplikasi telah menginstal dan mengaktifkan `@nocobase/plugin-ai`. Kode plugin dapat menggunakan tipe dan fungsi definisi yang disediakan oleh `@nocobase/ai` dan `@nocobase/actions`.

:::tip Baca dulu

- [Menulis plug-in](../../../plugin-development/write-your-first-plugin.md) - Jika Anda tidak memiliki pengalaman dalam pengembangan plug-in, pahami dulu direktori plug-in, proses pembuatan dan pengaktifannya
- [Karyawan AI](../../index.md) — Pertama-tama kenali konfigurasi dan penggunaan dasar Karyawan AI

:::


## Indeks cepat

| Saya ingin... | Baca halaman |
| --- | --- |
| Memungkinkan AI memanggil operasi sisi server | [Mendefinisikan Tool Sisi Server](./define-tool.md) |
| Menentukan alur pemanggilan beberapa Tool | [Mendefinisikan Skill](./define-skill.md) |
| Menyediakan peran AI tetap bersama plugin | [Mendefinisikan Karyawan AI Bawaan](./define-ai-employee.md) |
| Melihat cara lengkap menggabungkan Tool, Skill, dan karyawan | [Contoh Lengkap: Membuat Karyawan AI Bawaan](./complete-example.md) |
| Menambahkan antarmuka konfirmasi, pilihan, atau pengeditan ke Tool | [Menambahkan Interaksi Frontend ke Tool](./frontend-tool-ui.md) |
| Menambahkan terjemahan antarmuka pengelolaan untuk Tool dan Skill | [Internasionalisasi Plugin Karyawan AI](./internationalization.md) |
| Memecahkan masalah pendaftaran, pengikatan, dan eksekusi | [Masalah Umum](./troubleshooting.md) |

## Putuskan lapisan mana yang ingin Anda perluas terlebih dahulu

Alat, keterampilan, dan pekerja AI bawaan bukanlah tiga fungsi independen, namun kemampuan yang digabungkan lapis demi lapis dari bawah ke atas. Tidak semua plugin perlu mengimplementasikan ketiga lapisan tersebut.

```text
Tool：让 AI 能执行一个具体动作
  ↓
Skill：让 AI 按固定方法完成一类任务
  ↓
内置 AI 员工：把这些能力装配成一个固定角色和使用入口
```

Anda dapat menentukan level mana yang akan dimulai berdasarkan kebutuhan Anda:

- Biarkan AI menanyakan data, memanggil API, atau mengubah catatan dan menentukan Alat.
- Penting untuk menentukan urutan pemanggilan alat, langkah konfirmasi dan format keluaran, lalu menentukan Keterampilan untuk Alat ini
- Jika Anda ingin memberikan peran tetap langsung setelah plugin diaktifkan, lanjutkan membuat karyawan AI bawaan dan ikat Keterampilan dan Alat yang sesuai

Ketika ketiga lapisan digunakan, tugas akan dijalankan dengan urutan berikut:

1. Pengguna meminta tugas kepada staf AI
2. Karyawan AI menentukan Keterampilan mana yang perlu digunakan berdasarkan kata-kata perintah sistem
3. Keterampilan memberi tahu model Alat mana yang harus dipanggil dan dalam urutan apa
4. Alat mengeksekusi kueri, penulisan, atau permintaan eksternal dan mengembalikan hasilnya
5. Staf AI mengatur tanggapan akhir berdasarkan hasil Alat

Kartu front-end alat bukanlah kemampuan tingkat keempat. Ini hanya melengkapi antarmuka interaktif untuk ToolCall ketika Alat memerlukan konfirmasi pengguna, pemilihan opsi, atau pengeditan parameter.

## Masukkan sumber daya AI ke `src/ai`

NocoBase menemukan sumber daya AI dalam plugin berdasarkan konvensi direktori. Saat menggunakan direktori plug-in standar, cukup masukkan Alat, Keterampilan, dan pekerja AI bawaan ke `src/ai`. Tidak perlu mendaftarkannya satu per satu di `src/server/plugin.ts` dan `load()`.

Direktori lengkap dapat diatur seperti ini:

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

Lokasi yang berbeda sesuai dengan metode pendaftaran yang berbeda:

|file atau direktori|Bagaimana NocoBase bekerja|
| --- | --- |
| `src/ai/tools/<name>.ts` |Daftarkan Alat mandiri|
| `src/ai/skills/<name>/SKILLS.md` |Daftarkan Keterampilan|
|`tools/` di direktori Keterampilan|Daftarkan Alat dan secara otomatis mengikat ke Keterampilan saat ini|
| `src/ai/ai-employees/<name>.ts` |Daftarkan karyawan AI bawaan satu file|
| `src/ai/ai-employees/<name>/index.ts` |Daftarkan karyawan AI bawaan bergaya direktori|
|`prompt.md` di bawah direktori karyawan AI|Sebagai kata prompt sistem default untuk karyawan ini|
|`skills/` dan `tools/` di bawah direktori karyawan AI|Daftarkan sumber daya dan ikat secara otomatis ke karyawan saat ini|

Saat plugin dimuat, NocoBase akan menyelesaikan tugas berikut secara berurutan sebelum menjalankan `load()` milik plugin:

1. Pindai dan daftarkan Alat
2. Parsing `SKILLS.md` dan ikat Alat di direktori Keterampilan ke Keterampilan yang sesuai
3. Muat karyawan AI bawaan dan gabungkan `prompt.md`, Keterampilan dan Alat di direktori karyawan

`src/client-v2` tidak termasuk dalam kumpulan direktori pemindaian otomatis ini. Hanya ketika Alat memerlukan kartu front-end, jendela pop-up, atau logika eksekusi sisi browser, pendaftaran tambahan di `src/client-v2/plugin.tsx` diperlukan.

## Ringkasan Titik Ekstensi dan Direktori

|titik ekstensi|Bertanggung jawab atas apa|Di mana meletakkannya secara default|
| --- | --- | --- |
| Tool |Lakukan operasi tertentu seperti kueri, penulisan, atau permintaan eksternal| `src/ai/**/tools/` |
| Skill |Tentukan alur pemrosesan, urutan pemanggilan alat, dan batasan keluaran| `src/ai/**/skills/<name>/SKILLS.md` |
|Staf AI bawaan|Tentukan peran tetap dan kumpulkan petunjuk sistem, keterampilan, dan alat| `src/ai/ai-employees/` |
|Kartu front-end alat|Paparkan ToolCall dan kumpulkan tindakan konfirmasi, edit, atau tolak| `src/client-v2/` |

Alat diimplementasikan pertama kali secara default. Menambah keterampilan ketika alur kerja tetap diperlukan, dan menciptakan karyawan AI bawaan ketika entri peran tetap diperlukan; hanya tambahkan kartu front-end ketika alat memerlukan interaksi browser.

## Tautan terkait

- [Menulis plugin pertama Anda](../../../plugin-development/write-your-first-plugin.md) — Membuat dan menjalankan plugin NocoBase dari awal
- [Ikhtisar Karyawan AI](../../index.md) — Memahami pintu masuk penggunaan Karyawan AI
- [Panduan Teknik Prompt](../../configuration/prompt-engineering-guide.md) — Menulis kata-kata cepat sistem dan batasan tugas
