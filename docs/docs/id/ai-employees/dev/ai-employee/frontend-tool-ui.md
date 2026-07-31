---
title: "Menambahkan Interaksi Frontend ke Tool"
description: "Perkenalkan kartu, modal, keputusan.edit, dan eksekusi frontend dari Alat Karyawan AI NocoBase, dan tambahkan kartu pilihan ke Pembantu Pengembang."
keywords: "NocoBase, Kartu frontend alat, Properti UI Alat, keputusan.edit, Kartu Saran Opsi, Alat frontend"
---

# Menambahkan Interaksi Frontend ke Tool

Sebagian Tool hanya perlu dijalankan di sisi server dan tidak memerlukan antarmuka khusus. Tool lain perlu meminta pengguna untuk mengonfirmasi, memilih, atau mengedit parameter. Dalam situasi ini, Anda dapat mendaftarkan kartu, modal, atau logika eksekusi browser untuk Tool dengan nama yang sama.

:::tip Bedakan Dua Konsep

**Kartu frontend** hanya menangani tampilan ToolCall dan interaksi pengguna; kartu tidak berarti logika bisnis Tool harus dijalankan di browser.

Jika Anda hanya menampilkan pilihan seperti `suggestions` lalu melanjutkan `invoke()` di server setelah pengguna memilih, pertahankan nilai default `execution: 'backend'`. Gunakan `execution: 'frontend'` dan implementasikan `invoke` di frontend hanya jika logika Tool benar-benar perlu mengakses halaman browser saat ini, FlowModel, atau status editor.

:::

Beberapa alat hanya perlu dijalankan di sisi server dan tidak memerlukan antarmuka yang disesuaikan. Alat lain harus memungkinkan pengguna mengonfirmasi, memilih, atau mengedit parameter. Dalam hal ini, Anda dapat mendaftarkan kartu front-end untuk Alat dengan nama yang sama.

:::tip Bedakan antara dua konsep

**Kartu front-end** hanya bertanggung jawab atas tampilan dan interaksi manusia-komputer di ToolCall. Ini tidak berarti bahwa logika bisnis Alat harus dijalankan di browser.

Jika Anda hanya menampilkan opsi seperti `suggestions` dan melanjutkan sisi server `invoke()` setelah pengguna memilihnya, biarkan saja default `execution: 'backend'`. Tetapkan `execution: 'frontend'` dan implementasikan front-end `invoke` hanya jika logika Alat yang sebenarnya harus mengakses halaman browser, FlowModel, atau status editor saat ini.

:::

## Mendefinisikan Parameter dan Logika Eksekusi di Server

Alat `suggestions` bawaan terletak di:

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Skemanya berisi kandidat dan pilihan akhir pengguna:

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Menurut deskripsi Alat, hanya `options` yang harus dibuat saat pertama kali model dipanggil. Karena Alat ini tidak memiliki `defaultPermission: 'ALLOW'` yang disetel dan izin defaultnya adalah `ASK`, ToolCall akan berhenti sejenak menunggu operasi pengguna.

Setelah pengguna memilihnya, ujung depan menggabungkan `option` ke dalam parameter asli melalui `decisions.edit()`, dan kemudian memulihkan ToolCall. Server `invoke()` akhirnya mengembalikan konten yang dipilih:

```ts
return {
  status: 'success',
  content: args?.option,
};
```

Implementasi bawaan juga akan menulis kembali hasil pemilihan ke `aiMessages.toolCalls`, sehingga ketika pesan historis dirender ulang, masih dapat menampilkan item mana yang dipilih pengguna.

## Menulis Kartu Tool

Penerimaan kartu front-end `ToolsUIProperties`:

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Melihat

Komponen ini menunjukkan penggunaan umum `decisions.edit()` dan menangani klik berulang dan parameter string JSON. Saat digunakan secara resmi, percakapan hanya-baca, pesan aktif saat ini, dan status pemilihan riwayat juga perlu ditangani sesuai dengan antarmuka obrolan. Untuk implementasi selengkapnya, silakan merujuk ke `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` menyediakan tiga operasi:

|metode|memengaruhi|
| --- | --- |
| `approve()` |Lanjutkan eksekusi menggunakan parameter asli|
| `edit(args)` |Lanjutkan eksekusi setelah mengubah parameter|
| `reject(message?)` |Tolak eksekusi dan kembalikan alasannya ke alur dialog|

`SuggestionsOptionsCard.tsx` bawaan juga menangani detail berikut:

- Kompatibel dengan bentuk array dan string JSON `options`
- ToolCall masih menampilkan pemuatan saat pembuatan
- Hanya pilihan yang diperbolehkan untuk ToolCall dalam status `interrupted`
- Nonaktifkan tombol segera setelah mengkliknya untuk menghindari pengiriman berulang
- Simpan opsi yang dipilih dalam pesan riwayat dan sorot opsi tersebut
- Hanya izinkan percakapan yang dapat diedit saat ini untuk memicu tindakan

## Mendaftarkan di Plugin Klien

Nama registrasi front-end harus sama persis dengan nama Alat di sisi server:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Jika file server adalah `src/ai/tools/developerChoice.ts`, `developerChoice` didaftarkan di sini.

Proses registrasi `suggestions` bawaan juga selesai seperti ini:

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Kemudian `PluginAIClientV2.load()` memanggil `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` untuk menggabungkan kartu ke dalam definisi Alat dengan nama yang sama yang dikembalikan oleh server.

## Memilih Kartu, Modal, atau Eksekusi Frontend

Hanya konfigurasi umum klien `ToolsOptions` yang tercantum di bawah. Lihat `packages/core/client-v2/src/ai/tools-manager/types.ts` untuk tipe lengkapnya.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Menggunakan Kartu

Gunakan `card` terlebih dahulu secara default. Kartu cocok untuk menampilkan status eksekusi, tombol konfirmasi, dan beberapa pilihan di posisi ToolCall.

### Menggunakan Modal

Tambahkan `modal` jika kontennya banyak, memerlukan pratinjau berukuran besar, atau membutuhkan pengeditan parameter yang rumit.

### Menjalankan Tool di Browser

Jika Tool sisi server menetapkan `execution: 'frontend'`, klien juga perlu menyediakan `invoke`. Tool jenis ini cocok untuk membaca konteks halaman saat ini, konten editor, atau status FlowEngine, tetapi tidak cocok untuk menulis data yang memerlukan perlindungan izin sisi server.

## Contoh Lengkap: Menambahkan Kartu Pilihan ke Karyawan AI Bawaan

Setelah menyelesaikan [Contoh Lengkap: Membuat Karyawan AI Bawaan](./complete-example.md), Anda dapat mengubah pertanyaan lanjutan `Dev Helper` menjadi opsi yang dapat diklik. Tentukan Tool `developerChoice` dan daftarkan kartu frontend. File sisi server ditempatkan di:

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Alat ini bertanggung jawab untuk mendeklarasikan opsi dan menerima pilihan pengguna:

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```
Karena `developerChoice.ts` terletak di direktori `tools/` Skill `welcome-developer`, maka secara otomatis terikat ke Skill saat ini. Namun, pengikatan hanya berarti model dapat menggunakan Alat ini, namun tidak berarti model pasti akan memanggilnya.

Alur kerja `SKILLS.md` juga perlu dimodifikasi secara bersamaan, menggantikan langkah awal 5–6 dengan:

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

Kartu front-end menggunakan kembali `DeveloperChoiceCard` yang ditentukan sebelumnya dan menyimpannya ke:

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Akhirnya terdaftar di `src/client-v2/plugin.tsx`:

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Setelah registrasi kartu selesai, bangun kembali klien. Ketika `developerChoice` tercapai dalam percakapan, ToolCall berhenti sejenak dan menampilkan opsi yang dapat diklik.

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->

## Tautan terkait

- [Mendefinisikan Tool server](./define-tool.md) — Mendefinisikan Tool server yang sesuai dengan kartu front-end
- [Contoh Lengkap: Membuat Karyawan AI Bawaan](./complete-example.md) — Selesaikan contoh dasar Dev Helper terlebih dahulu
- [Internasionalisasi](./internationalization.md) — Terjemahkan salinan antarmuka manajemen Alat dan Keterampilan
- [Plugin Klien](../../../plugin-development/client/plugin.md) — Memahami entri plugin klien dan `load()`
