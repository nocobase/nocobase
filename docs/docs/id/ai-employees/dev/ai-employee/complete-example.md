---
title: "Contoh Lengkap: Membuat Karyawan AI Bawaan"
description: "Mendefinisikan Tool, Keterampilan, kata-kata perintah sistem, dan pekerja AI bawaan di plugin NocoBase dengan contoh lengkap."
keywords: "NocoBase,Pembantu Pengembang,Contoh Karyawan AI,defineTools,defineAIEmployee,SKILLS.md"
---

# Contoh Lengkap: Membuat Karyawan AI Bawaan

Contoh lengkap berikut membuat karyawan AI bawaan yang memandu pengembangan plugin. Dalam contoh ini, karyawan diberi nama `Dev Helper` serta dilengkapi Tool, Skill, dan system prompt. Saat pengguna mengatakan “Tolong sapa Alice,” karyawan akan memuat Skill `welcome-developer`, memanggil Tool `greetDeveloper` untuk mengonfirmasi nama, lalu membuat sapaan dalam bahasa pengguna saat ini.

:::tip Prasyarat

- [Mendefinisikan Tool Sisi Server](./define-tool.md) — Pelajari struktur dasar `defineTools()` dan Tool
- [Mendefinisikan Skill](./define-skill.md) — Pelajari `SKILLS.md` dan pengikatan Tool
- [Mendefinisikan Karyawan AI Bawaan](./define-ai-employee.md) — Pelajari `defineAIEmployee()` dan direktori karyawan

:::

Di bawah ini membuat pekerja AI bawaan bernama `Dev Helper`. Saat pengguna mengatakan "Tolong sapa Alice," karyawan tersebut memuat Keterampilan `welcome-developer`, memanggil Alat `greetDeveloper` untuk mengonfirmasi nama, dan kemudian membuat salam dalam bahasa pengguna saat ini.

## Hasil akhir

Setelah selesai, plugin ini akan memberikan kemampuan berikut:

- Buat karyawan AI bawaan bernama `Dev Helper`
- Secara otomatis mengikat `welcome-developer` Keterampilan untuk karyawan
- Konfirmasikan nama pengembang dengan memanggil `greetDeveloper` Alat melalui Keterampilan
- Hasilkan salam dan pertanyaan lanjutan berdasarkan bahasa pengguna saat ini

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## Struktur direktori akhir

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Contoh ini tidak memerlukan kode front-end atau registrasi manual di `src/server/plugin.ts`.

## Langkah 1: Mendefinisikan Tool

Buat `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts`:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Langkah 2: Mendefinisikan Skill

Buat `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md`:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Karena `greetDeveloper.ts` terletak di direktori `tools/` Skill saat ini, maka tidak perlu menulis `tools: [greetDeveloper]`.

## Langkah 3: Mendefinisikan Profil Karyawan AI

Buat `src/ai/ai-employees/dev-helper/index.ts`:

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` adalah pengidentifikasi unik dalam database. Jangan memodifikasinya setelah dipublikasikan, jika tidak, NocoBase akan memperlakukan nilai baru tersebut sebagai pekerja AI bawaan lainnya.

:::warning Melihat

`username` Tidak hanya harus stabil, tetapi juga harus menghindari nama yang sama dengan plugin lain atau karyawan AI yang ada. Jika `username` yang sama sudah ada di database, catatan terkait akan diperbarui saat plugin dimuat alih-alih membuat karyawan baru yang terisolasi satu sama lain.

Saat memuat ulang plugin, `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, kata-kata perintah sistem default, pengikatan Keterampilan dan Alat, `chatSettings`, dan `sort` dalam kode dapat ditulis ulang ke database. Plug-in formal disarankan untuk menggunakan nama dengan awalan plug-in, seperti `developer-helper-dev-assistant`.

:::

## Langkah 4: Mendefinisikan System Prompt

Buat `src/ai/ai-employees/dev-helper/prompt.md`:

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

Pada titik ini, hubungan direktori telah terikat secara otomatis:

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Langkah 5: Aktifkan dan verifikasi

Bangun kembali atau mulai ulang layanan pengembangan dan konfirmasikan bahwa plugin yang berisi file-file ini diaktifkan. Lalu buka halaman manajemen karyawan AI untuk memeriksa:

- Dapat melihat `Dev Helper`
- Karyawan ditandai sebagai karyawan bawaan
- Skill eksklusif karyawan berisi `welcome-developer`
- Keterampilan dapat digunakan setelah memuat `greetDeveloper`

Dalam percakapan masukkan:

```text
请向 Alice 打个招呼。
```

Proses yang diharapkan adalah sebagai berikut:

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Jika Anda tidak ingin Alat meminta konfirmasi pengguna sebelum setiap panggilan, setel `defaultPermission: 'ALLOW'`. Untuk Alat yang melibatkan penghapusan, modifikasi batch, atau efek samping eksternal, lebih tepat membiarkan `ASK` secara default.


## Ringkasan

| File | Tanggung jawab |
| --- | --- |
| `greetDeveloper.ts` | Memvalidasi input dan mengembalikan hasil Tool yang terstruktur |
| `SKILLS.md` | Menentukan alur pemanggilan Tool dan pemrosesan respons |
| `prompt.md` | Menentukan peran karyawan dan batasan umum |
| `index.ts` | Menentukan profil karyawan AI bawaan |

## Tautan terkait

- [Pengembangan Plug-in Karyawan AI](./index.md) — Memahami hubungan antara Alat, Keterampilan, dan Karyawan AI bawaan
- [Mendefinisikan Tool server](./define-tool.md) — Lihat konfigurasi lengkap `defineTools()`
- [Definisi Keterampilan](./define-skill.md) — Melihat bidang dan metode penulisan `SKILLS.md`
- [Mendefinisikan Karyawan AI Bawaan ](./define-ai-employee.md) — lihat `defineAIEmployee()` dan pengikatan direktori
- [Internasionalisasi](./internationalization.md) — Tambahkan terjemahan ke salinan antarmuka admin pada contoh
