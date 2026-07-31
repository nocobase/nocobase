---
title: "Mendefinisikan Karyawan AI Bawaan"
description: "Menjelaskan bagaimana plugin NocoBase menciptakan karyawan AI bawaan menggunakan direktori defineAIEmployee, prompt.md, keterampilan, dan alat."
keywords: "NocoBase, karyawan AI bawaan,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Mendefinisikan Karyawan AI Bawaan

Pekerja AI bawaan terdaftar pada plugin. Saat plugin dimuat untuk pertama kalinya, NocoBase akan membuat catatan karyawan yang sesuai dan menandainya sebagai karyawan bawaan; pemuatan plugin berikutnya akan memperbarui informasi default karyawan, kata-kata cepat, keterampilan, dan alat berdasarkan kode.

## Bentuk file dan direktori tunggal

Ketika datanya sederhana dan kata-kata cepat yang independen serta sumber daya eksklusif tidak diperlukan, satu file dapat digunakan:

```text
src/ai/ai-employees/lina.ts
```

Saat Anda memerlukan `prompt.md`, Keterampilan berpemilik, atau Alat berpemilik, gunakan direktori:

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

Format direktori lebih cocok untuk pemeliharaan jangka panjang.

## Gunakan `defineAIEmployee()`

`index.ts` menggunakan `defineAIEmployee()` yang disediakan oleh `@nocobase/ai`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Bidang utama adalah sebagai berikut:

|Bidang|memengaruhi|
| --- | --- |
| `username` |ID unik karyawan AI, diperlukan dan memerlukan stabilitas jangka panjang|
| `category` |Klasifikasi karyawan, seperti `developer` atau `business`|
| `description` |Deskripsi internal dan pengambilan informasi|
| `avatar` |Logo Avatar|
| `nickname` |Nama ditampilkan kepada pengguna|
| `position` |Posisi|
| `bio` |Perkenalan|
| `greeting` |Salam percakapan baru|
| `systemPrompt` |Kata perintah sistem default|
| `skills` |Nama Skill yang terikat secara eksplisit|
| `tools` |Konfigurasi Alat terikat secara eksplisit|
| `chatSettings` |Apakah akan mengaktifkan pengaturan obrolan seperti Keterampilan, Alat, dan mode kata prompt sistem|
| `sort` |Penyortiran karyawan bawaan|

Saat ini tipe `tools` adalah array objek:

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` hanya digunakan untuk mengganti izin panggilan karyawan AI saat ini ke Alat `CUSTOM`. Untuk Alat `GENERAL` dan `SPECIFIED`, waktu proses masih berdasarkan `defaultPermission` milik Alat itu sendiri; jika Alat `CUSTOM` tidak memiliki konfigurasi tingkat karyawan, Alat tersebut juga akan kembali ke `defaultPermission` milik Alat tersebut.

Alat yang ditemukan secara otomatis di direktori akan dinormalisasi menjadi `{ name: 'toolName' }`.

## Menempatkan Prompt Panjang di `prompt.md`

Jika karyawan AI menggunakan format direktori, kata-kata perintah sistem dapat dimasukkan ke `prompt.md` pada tingkat yang sama:

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

`prompt.md`, jika ada, menggantikan `systemPrompt` di `index.ts`. Menempatkan perintah panjang dalam file Markdown lebih mudah untuk ditinjau dan menghindari keluarnya masalah dalam string templat TypeScript.

## Contoh Karyawan AI Bawaan: Nathan

Profil karyawan `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` sangat singkat:

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Kemampuan lengkap Nathan berasal dari sumber lain di direktori yang sama:

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

Proses pemuatan secara otomatis akan menyelesaikan pengikatan tiga lapis:

1. File di `tools/` didaftarkan sebagai Alat
2. Alat secara otomatis terikat pada `frontend-developer` Keterampilan
3. Skill otomatis terikat pada Nathan

Oleh karena itu, `index.ts` tidak perlu dicantumkan berulang kali untuk seluruh himpunan `skills` dan `tools`.

## Tautan terkait

- [Pengembangan Plugin Karyawan AI](./index.md) — Memahami hubungan antara karyawan AI bawaan serta Alat dan Keterampilan
- [Definisi Keterampilan](./define-skill.md) — Membuat Keterampilan khusus karyawan
- [Contoh Lengkap: Membuat Karyawan AI Bawaan](./complete-example.md) — Lihat direktori karyawan lengkap dan proses pendaftaran
- [Internasionalisasi](./internationalization.md) — Memahami perbedaan pelokalan antara informasi karyawan dan copywriting Alat dan Keterampilan
