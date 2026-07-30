---
title: "Mendefinisikan Tool Sisi Server"
description: "Memperkenalkan metode penetapan, cakupan, skema, pemanggilan, izin, dan pendaftaran direktori Alat server karyawan NocoBase AI."
keywords: "NocoBase, Alat Staf AI, tentukan Alat, ToolsOptions, Zod, aktifkan"
---

# Mendefinisikan Tool Sisi Server

Di NocoBase, **Tool** bertugas menjalankan operasi tertentu seperti kueri, penulisan, atau permintaan eksternal. Tool sisi server biasanya didefinisikan dengan `defineTools()` dari `@nocobase/ai` dan ditempatkan di direktori `src/ai/**/tools/` pada plugin.

## Struktur Minimal Tool

Alat sisi server menggunakan definisi `defineTools()` yang disediakan oleh `@nocobase/ai`. Alat berikut mengambil nama dan mengembalikan salam:

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
    description: 'Generate a short greeting for the developer named by the user.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name to greet.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: `Hello ${args.name}, welcome to NocoBase plugin development!`,
    };
  },
});
```

Jika jalur file adalah `src/ai/tools/greetDeveloper.ts`, pemuat akan menggunakan nama file `greetDeveloper` sebagai nama Alat akhir. Sekalipun `definition.name` ditulis dengan nilai lain, akan ditimpa dengan nama file saat pendaftaran.

Oleh karena itu, secara default, nama yang direferensikan dalam nama file, `definition.name`, dan Skill konsisten dengan nama yang terdaftar di front end.

## Opsi Konfigurasi Tool

Konfigurasi utama `defineTools()` adalah sebagai berikut:

|Konfigurasi|memengaruhi|nilai bawaan|
| --- | --- | --- |
| `scope` |Tentukan cakupan Alat yang tersedia|Diperlukan|
| `execution` |Tentukan apakah logika dijalankan di `backend` atau `frontend`| `backend` |
| `defaultPermission` |Apakah akan langsung mengizinkan atau meminta konfirmasi sebelum memanggil Alat| `ASK` |
| `silence` |Apakah akan menyembunyikan perintah panggilan Alat dalam percakapan| `false` |
| `introduction` |Judul dan deskripsi ditampilkan pada antarmuka manajemen|Gunakan nama alat|
| `definition` |Nama, deskripsi, dan skema parameter diberikan kepada model|Diperlukan|
| `invoke` |Logika eksekusi alat yang sebenarnya|Diperlukan|

Pilihan `scope` akan secara langsung mempengaruhi bagaimana Alat memasuki konteks karyawan AI:

| `scope` |Penggunaan|
| --- | --- |
| `GENERAL` |Dibagikan oleh semua karyawan AI, biasanya digunakan untuk kemampuan dasar yang umum|
| `SPECIFIED` |Hanya karyawan Skill atau AI yang terikat dengan Alat ini yang dapat menggunakannya|
| `CUSTOM` |Administrator dapat menambahkannya secara manual dalam konfigurasi staf AI dan mengatur "Tanya" atau "Izinkan"|

Rekomendasi defaultnya adalah `SPECIFIED`. Gunakan `GENERAL` hanya jika Anda yakin bahwa setiap karyawan AI membutuhkan kemampuan ini; gunakan `CUSTOM` jika Anda ingin administrator memilih berdasarkan karyawan.

## `definition` ditulis agar model dapat melihatnya

`definition.description` dan `definition.schema` akan memengaruhi apakah model memilih Alat ini dan cara membuat parameter. Uraiannya perlu memperjelas tiga hal:

- Disebut dalam keadaan apa?
- Apa yang diwakili oleh setiap parameter?
- Hal-hal apa yang tidak boleh ditangani oleh Alat ini

Disarankan untuk menggunakan Zod untuk skema parameter:

```ts
schema: z.object({
  query: z.string().describe('A specific search query.'),
  limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of records to return.'),
})
```

Nama alat juga harus tetap stabil. Keterampilan, staf AI, kartu front-end, dan pesan obrolan yang disimpan semuanya akan menemukannya berdasarkan nama.

## Data yang Diterima `invoke()`

Server `invoke()` menerima tiga parameter:

```ts
invoke: async (ctx, args, runtime) => {
  // ctx：当前 NocoBase action Context
  // args：模型根据 schema 生成的参数
  // runtime.toolCallId：当前 ToolCall ID
  // runtime.writer(chunk)：流式写出中间结果
}
```

Aplikasi saat ini, database, informasi otentikasi dan parameter tindakan dapat diakses melalui `ctx`. Misalnya:

```ts
const repository = ctx.app.db.getRepository('posts');
const currentUser = ctx.auth?.user;
const values = ctx.action?.params?.values;
```

Alat harus mengembalikan struktur yang menentukan keberhasilan atau kegagalan. Alat Bawaan biasanya menggunakan bentuk berikut:

```ts
return {
  status: 'success',
  content: result,
};
```

Saat menghadapi kegagalan bisnis yang dapat diprediksi, status dan alasan yang jelas juga harus dikembalikan, dan jangan biarkan model menebak apakah operasi tersebut berhasil.

## Menggunakan Direktori untuk Deskripsi Panjang

Selain berbentuk file tunggal, Tool juga dapat menggunakan direktori:

```text
src/ai/tools/documentSearch/
├── index.ts
└── description.md
```

`index.ts` mengekspor hasil `defineTools()` secara default. Ketika `description.md` ada, konten lengkapnya akan menimpa `definition.description`, yang cocok untuk menyimpan instruksi penggunaan Alat yang panjang.

Nama direktori `documentSearch` akan menjadi nama akhir yang terdaftar.


## Contoh Tool Bawaan: `subAgentWebSearch`

`packages/plugins/@nocobase/plugin-ai/src/ai/tools/subAgentWebSearch.ts` menunjukkan Alat server lengkap:

```ts
export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("Web search")}}',
    about: '{{t("Use web search to quickly find up-to-date information from the internet.")}}',
  },
  definition: {
    name: 'subAgentWebSearch',
    description: 'Search the web for current information...',
    schema: z.object({
      query: z.array(z.string()),
    }),
  },
  invoke: async (ctx, args) => {
    // 获取 AI 插件和当前会话使用的模型配置。
    const pluginAI = ctx.app.pm.get('ai') as PluginAIServer;
    const { model } = ctx.action?.params?.values ?? {};
    const { provider } = await pluginAI.aiManager.getLLMService({
      ...model,
      webSearch: true,
      reasoning: { mode: 'off' },
    });

    // 独立查询并行执行，最后统一返回。
    const result = await Promise.all(
      args.query.map(async (query) => {
        const content = await provider.invoke(/* messages */);
        return { query, result: content.text };
      }),
    );

    return { status: 'success', content: result };
  },
});
```

Implementasi ini memiliki beberapa praktik yang dapat digunakan kembali:

- Gunakan `SPECIFIED` untuk membatasi akses alat kepada karyawan atau keterampilan tertentu
- Membatasi parameter yang dihasilkan model dengan Zod
- Baca konfigurasi sesi AI saat ini dari `ctx.action.params.values`
- Masukkan beberapa kueri independen ke dalam ToolCall dan jalankan secara paralel melalui `Promise.all()`
- Kembalikan hasil terstruktur dengan sumber yang jelas dan biarkan model tingkat atas terus memilahnya

## Tautan terkait

- [Pengembangan Plugin Karyawan AI](./index.md) — Pilih tingkat kemampuan yang perlu diperluas
- [Definisi Keterampilan](./define-skill.md) — Gunakan Keterampilan untuk mengatur proses pemanggilan beberapa Alat
- [Contoh Lengkap: Membuat Karyawan AI Bawaan](./complete-example.md) — Lihat contoh Alat yang berfungsi
- [Tambahkan kartu front-end ](./frontend-tool-ui.md) untuk Alat — Tambahkan antarmuka konfirmasi dan pemilihan untuk ToolCall
