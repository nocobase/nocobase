---
title: "Extension Point Plugin RunJS"
description: "Extension Point Plugin RunJS: dokumentasi ctx, snippets potongan kode, mapping skenario, memperluas pengalaman pengembangan RunJS, ekstensi JS Model FlowEngine."
keywords: "extension point RunJS,dokumentasi ctx,snippets,mapping skenario,JS Model,FlowEngine,NocoBase"
---

# Extension Point Plugin RunJS (Dokumentasi ctx / snippets / Mapping Skenario)

Saat plugin menambahkan atau memperluas kapabilitas RunJS, disarankan untuk mendaftarkan "mapping konteks / dokumentasi `ctx` / kode contoh" melalui **extension point resmi**, agar:

- CodeEditor dapat melakukan auto-complete `ctx.xxx.yyy`
- AI coding dapat memperoleh API reference + contoh `ctx` yang terstruktur

Bab ini memperkenalkan dua extension point:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Digunakan untuk mendaftarkan "contribution" RunJS, penggunaan tipikal:

- Menambahkan/override mapping `RunJSContextRegistry` (modelClass -> RunJSContext, termasuk `scenes`)
- Memperluas `RunJSDocMeta` (penjelasan/contoh/template auto-complete API `ctx`) untuk `FlowRunJSContext` atau RunJSContext kustom

### Penjelasan Perilaku

- contribution akan dieksekusi terpadu pada tahap `setupRunJSContexts()`;
- Jika `setupRunJSContexts()` sudah selesai, **registrasi terlambat akan langsung dieksekusi sekali** (tidak perlu menjalankan setup lagi);
- Setiap contribution untuk setiap `RunJSVersion` **hanya akan dieksekusi maksimal sekali**.

### Contoh: Menambahkan Konteks Model yang Dapat Menulis JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Dokumentasi ctx/auto-complete (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) mapping model -> context (scene mempengaruhi auto-complete editor/filter snippets)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Digunakan untuk mendaftarkan potongan kode contoh RunJS (snippets), digunakan untuk:

- Auto-complete snippet CodeEditor
- Sebagai contoh/material referensi untuk AI coding (dapat di-trim berdasarkan skenario/versi/locale)

### Penamaan ref yang Direkomendasikan

Disarankan menggunakan: `plugin/<pluginName>/<topic>`, contoh:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Hindari konflik dengan `global/*`, `scene/*` dari core.

### Strategi Konflik

- Default tidak override `ref` yang sudah ada (return `false`, tetapi tidak throw error)
- Saat perlu override, secara eksplisit kirim `{ override: true }`

### Contoh: Mendaftarkan Snippet

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. Best Practice

- **Maintenance dokumentasi + snippets berlapis**:
  - `RunJSDocMeta`: deskripsi/template auto-complete (pendek, terstruktur)
  - snippets: contoh panjang (dapat digunakan ulang, dapat difilter berdasarkan scene/version)
- **Hindari prompt terlalu panjang**: contoh sebaiknya tidak terlalu banyak, prioritaskan menyatukan ke "template minimum yang dapat dijalankan".
- **Prioritas skenario**: Jika kode JS Anda terutama berjalan di skenario form/tabel, dll., usahakan mengisi `scenes` dengan benar, meningkatkan relevansi auto-complete dan contoh.

## 4. Menyembunyikan Auto-complete Berdasarkan ctx Aktual: `hidden(ctx)`

Beberapa API `ctx` memiliki kekhasan skenario yang kuat (misalnya `ctx.popup` hanya tersedia saat modal/drawer terbuka). Saat Anda ingin menyembunyikan API yang tidak tersedia ini saat auto-complete, dapat mendefinisikan `hidden(ctx)` untuk entri yang sesuai di `RunJSDocMeta`:

- Return `true`: Sembunyikan node saat ini dan sub-tree-nya
- Return `string[]`: Sembunyikan sub-path tertentu di bawah node saat ini (mendukung mengembalikan beberapa path sekaligus; path adalah relative; menyembunyikan sub-tree berdasarkan prefix match)

`hidden(ctx)` mendukung async: Anda dapat menggunakan `await ctx.getVar('ctx.xxx')` untuk menentukan (penilaian dilakukan oleh pengguna sendiri). Disarankan secepat mungkin, tanpa side effect (jangan mengirim network request).

Contoh: Hanya menampilkan auto-complete `ctx.popup.*` saat ada `popup.uid`

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

Contoh: popup tersedia tetapi menyembunyikan beberapa sub-path (hanya path relative; misalnya menyembunyikan `record` dan `parent.record`)

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

Penjelasan: CodeEditor selalu mengaktifkan filter auto-complete berdasarkan `ctx` aktual (fail-open, tidak throw error).

## 5. `info/meta` Runtime dan API Informasi Konteks (untuk Auto-complete dan Large Model)

Selain mengelola dokumentasi `ctx` melalui `FlowRunJSContext.define()` (statis), Anda juga dapat menyuntikkan **info/meta** saat runtime melalui `FlowContext.defineProperty/defineMethod`, dan output informasi konteks **yang dapat di-serialize** melalui API berikut, untuk digunakan oleh CodeEditor/Large Model:

- `await ctx.getApiInfos(options?)`: Informasi API statis
- `await ctx.getVarInfos(options?)`: Informasi struktur variabel (sumber `meta`, mendukung path/maxDepth expansion)
- `await ctx.getEnvInfos()`: Snapshot environment runtime

### 5.1 `defineMethod(name, fn, info?)`

`info` mendukung (semua opsional):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc-like)

> Perhatian: Output `getApiInfos()` adalah dokumentasi API statis, tidak akan menyertakan field seperti `deprecated` / `disabled` / `disabledReason`.

Contoh: Menyediakan link dokumentasi untuk `ctx.refreshTargets()`

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Refresh data Block target',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Untuk UI variable selector (`getPropertyMetaTree` / `FlowContextSelector`), menentukan apakah ditampilkan, struktur tree, disabled, dll. (mendukung function/async).
  - Field umum: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Untuk dokumentasi API statis (`getApiInfos`) dan deskripsi untuk large model, tidak mempengaruhi UI variable selector (mendukung function/async).
  - Field umum: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Saat hanya menyediakan `meta` (tidak menyediakan `info`):

- `getApiInfos()` tidak akan return key tersebut (karena dokumentasi API statis tidak diinfer dari `meta`)
- `getVarInfos()` akan membangun struktur variabel berdasarkan `meta` (untuk variable selector/dynamic variable tree)

### 5.3 API Informasi Konteks

Digunakan untuk output "informasi kapabilitas konteks yang tersedia", bentuk return adalah skema A (tidak lagi membungkus dengan `{ apis/envs/... }`).

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Dapat langsung digunakan untuk await ctx.getVar(getVar), direkomendasikan dimulai dengan "ctx."
  value?: any; // Nilai statis yang sudah di-parse (dapat di-serialize, hanya return saat dapat diinfer)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Dokumentasi statis (satu lapisan top-level)
type FlowContextVarInfos = Record<string, any>; // Struktur variabel (dapat di-expand berdasarkan path/maxDepth)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

Parameter umum:

- `getApiInfos({ version })`: Versi dokumentasi RunJS (default `v1`)
- `getVarInfos({ path, maxDepth })`: Trimming dan level expand maksimum (default 3)

Perhatian: Hasil return semua API di atas tidak berisi function, cocok untuk langsung di-serialize dan dikirim ke large model.

### 5.4 `await ctx.getVar(path)`

Saat Anda hanya memiliki "string path variabel" (misalnya dari konfigurasi/input pengguna), dan ingin langsung mendapatkan nilai runtime dari variabel tersebut, dapat menggunakan `getVar`:

- Contoh: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` adalah path ekspresi yang dimulai dengan `ctx.` (contoh `ctx.record.id` / `ctx.record.roles[0].id`)

Selain itu: Method/property yang dimulai dengan underscore `_` akan dianggap sebagai member privat, tidak akan muncul di output `getApiInfos()` / `getVarInfos()`.
