---
title: "ctx.ai"
description: "Gunakan ctx.ai di RunJS untuk memicu tugas karyawan AI, baik dengan isi tugas langsung maupun dengan tugas yang dikonfigurasi pada aksi karyawan AI."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

Di RunJS, `ctx.ai` digunakan untuk memicu **tugas karyawan AI**. API ini cocok untuk JSBlock, JSAction, dan interaksi lain ketika tombol, formulir, atau alur bisnis perlu menyerahkan pekerjaan kepada karyawan AI tertentu.

`ctx.ai` hanya memicu tugas. API ini tidak mengembalikan hasil eksekusi tugas. Setelah dipanggil, tugas akan masuk ke alur percakapan karyawan AI.

:::warning Catatan

`ctx.ai` disediakan oleh plugin AI. Jika plugin AI belum diaktifkan, atau lingkungan RunJS saat ini belum memuat kemampuan client yang sesuai, `ctx.ai` mungkin tidak ada. Anda dapat memeriksa `ctx.ai?.triggerTask` atau `ctx.ai?.triggerModelTask` sebelum memanggilnya.

:::

## Metode

### ctx.ai.triggerTask()

Memicu tugas karyawan AI secara langsung.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Karyawan AI. Jika string diberikan, NocoBase mencocokkan secara persis dengan `AIEmployee.username`, dan karyawan AI tersebut harus dapat diakses oleh pengguna saat ini. |
| `tasks` | `Task[]` | Daftar tugas yang akan dipicu. |
| `open` | `boolean` | Apakah panel percakapan karyawan AI dibuka. |
| `auto` | `boolean` | Apakah menggunakan semantik pemicu otomatis dari aksi karyawan AI. |

Field umum pada `Task`:

| Field | Tipe | Deskripsi |
|------|------|------|
| `title` | `string` | Judul tugas. |
| `message.system` | `string` | Pesan sistem untuk membatasi peran dan persyaratan keluaran karyawan AI. |
| `message.user` | `string` | Pesan pengguna, yaitu instruksi utama tugas ini. |
| `message.workContext` | `ContextItem[]` | Konteks blok halaman yang digunakan oleh tugas. |
| `autoSend` | `boolean` | Apakah pesan tugas dikirim otomatis. |
| `webSearch` | `boolean` | Apakah tugas ini boleh menggunakan Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Model yang digunakan oleh tugas ini. |
| `skillSettings` | `SkillSettings` | Konfigurasi skills / tools yang digunakan tugas ini. |

### Menambahkan konteks blok halaman

`message.workContext` saat ini digunakan untuk meneruskan blok halaman. Masukkan uid FlowModel dari blok target:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Field | Deskripsi |
|------|------|
| `type` | Tetap `flow-model`, menandakan konteks blok halaman. |
| `uid` | uid FlowModel dari blok halaman, seperti blok tabel, detail, atau grafik. |

Jika ingin menggunakan JSBlock saat ini sebagai konteks, gunakan uid model saat ini:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Menentukan model

`model` menentukan model untuk satu tugas. Jika dihilangkan, konfigurasi model default karyawan AI digunakan. Mengirim `null` berarti tidak menentukan model pada level tugas.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Mengonfigurasi skills / tools

`skillSettings` menentukan skills dan tools yang tersedia untuk satu tugas. Jika dihilangkan, konfigurasi kemampuan karyawan AI digunakan.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Untuk menonaktifkan semua skills atau tools secara eksplisit untuk tugas ini, kirim array kosong dan pertahankan field versi:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Contoh:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Jika `aiEmployee` berupa string, NocoBase mencocokkan secara persis berdasarkan `username` pada karyawan AI yang dapat diakses oleh pengguna saat ini.

### ctx.ai.triggerModelTask()

Membaca tugas dari model aksi karyawan AI pada halaman dan memicunya.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | uid FlowModel dari aksi karyawan AI. |
| `taskIndex` | `number` | Indeks tugas, dimulai dari `0`. |
| `options.open` | `boolean` | Apakah panel percakapan karyawan AI dibuka. |
| `options.auto` | `boolean` | Apakah menggunakan semantik pemicu otomatis dari aksi karyawan AI. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Jika model target tidak ada, belum mengonfigurasi karyawan AI, atau indeks yang diberikan tidak memiliki tugas, tugas tidak akan dipicu dan peringatan akan dicetak di console.

## Catatan

- `triggerTask()` dan `triggerModelTask()` bersifat fire-and-forget. Keduanya tidak mengembalikan hasil eksekusi tugas.
- String `aiEmployee` hanya cocok secara persis dengan `AIEmployee.username`.
- `triggerModelTask()` menggunakan `taskIndex` berbasis `0`.
- `message.workContext` saat ini hanya menjelaskan konteks blok halaman.

## Terkait

- [ctx.message](./message.md): Menampilkan pesan ringan sebelum dan sesudah memicu tugas.
- [ctx.render](./render.md): Merender tombol atau formulir di JSBlock.
- [ctx.model](./model.md): Mengambil informasi FlowModel saat ini.
