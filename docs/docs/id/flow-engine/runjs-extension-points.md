:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/flow-engine/runjs-extension-points).
:::

# Titik Ekstensi Plugin RunJS (Dokumentasi ctx / Snippet / Pemetaan Scene)

Ketika plugin menambahkan atau memperluas kemampuan RunJS, disarankan untuk mendaftarkan "pemetaan konteks / dokumentasi `ctx` / kode contoh" melalui **titik ekstensi resmi**. Hal ini memastikan:

- CodeEditor dapat memberikan pelengkapan otomatis (auto-completion) untuk `ctx.xxx.yyy`.
- AI coding dapat memperoleh referensi API `ctx` yang terstruktur dan contoh kodenya.

Bab ini memperkenalkan dua titik ekstensi:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

Digunakan untuk mendaftarkan "kontribusi" (contribution) RunJS. Kegunaan tipikal meliputi:

- Menambah/menimpa pemetaan `RunJSContextRegistry` (`modelClass` -> `RunJSContext`, termasuk `scenes`).
- Memperluas `RunJSDocMeta` (penjelasan/contoh/templat pelengkapan untuk API `ctx`) untuk `FlowRunJSContext` atau RunJSContext kustom.

### Deskripsi Perilaku

- Kontribusi akan dieksekusi secara kolektif selama fase `setupRunJSContexts()`.
- Jika `setupRunJSContexts()` telah selesai, **pendaftaran yang terlambat akan segera dieksekusi satu kali** (tidak perlu menjalankan ulang setup).
- Setiap kontribusi akan dieksekusi **paling banyak satu kali** untuk setiap `RunJSVersion`.

### Contoh: Menambahkan Konteks Model yang Dapat Ditulis JS

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) Dokumentasi/pelengkapan ctx (RunJSDocMeta)
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

  // 2) Pemetaan model -> konteks (scene memengaruhi pelengkapan editor/penyaringan snippet)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

Digunakan untuk mendaftarkan potongan kode contoh (snippet) RunJS, yang digunakan untuk:

- Pelengkapan snippet pada CodeEditor.
- Sebagai materi referensi/contoh untuk AI coding (dapat difilter berdasarkan scene/versi/lokal).

### Rekomendasi Penamaan ref

Disarankan untuk menggunakan: `plugin/<pluginName>/<topic>`, misalnya:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

Hindari konflik dengan namespace core `global/*` atau `scene/*`.

### Strategi Konflik

- Secara default, entri `ref` yang sudah ada tidak akan ditimpa (mengembalikan `false` tanpa memunculkan error).
- Jika perlu menimpa secara eksplisit, masukkan `{ override: true }`.

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
// Snippet plugin saya
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. Praktik Terbaik

- **Pemeliharaan Berlapis untuk Dokumentasi + Snippet**:
  - `RunJSDocMeta`: Deskripsi/templat pelengkapan (pendek, terstruktur).
  - Snippet: Contoh panjang (dapat digunakan kembali, dapat difilter berdasarkan scene/versi).
- **Hindari Prompt yang Terlalu Panjang**: Contoh harus ringkas; prioritaskan "templat minimal yang dapat dijalankan".
- **Prioritas Scene**: Jika kode JS Anda terutama berjalan pada skenario seperti formulir atau tabel, pastikan kolom `scenes` diisi dengan benar untuk meningkatkan relevansi pelengkapan dan contoh.

## 4. Menyembunyikan Pelengkapan Berdasarkan ctx Aktual: `hidden(ctx)`

Beberapa API `ctx` sangat bergantung pada konteks (misalnya, `ctx.popup` hanya tersedia saat popup atau drawer terbuka). Jika Anda ingin menyembunyikan API yang tidak tersedia ini selama pelengkapan, Anda dapat mendefinisikan `hidden(ctx)` untuk entri terkait di `RunJSDocMeta`:

- Mengembalikan `true`: Menyembunyikan node saat ini beserta sub-pohonnya.
- Mengembalikan `string[]`: Menyembunyikan jalur sub-jalur tertentu di bawah node saat ini (mendukung pengembalian beberapa jalur; jalur bersifat relatif; sub-pohon disembunyikan berdasarkan pencocokan awalan).

`hidden(ctx)` mendukung `async`: Anda dapat menggunakan `await ctx.getVar('ctx.xxx')` untuk menentukan visibilitas (sesuai keputusan pengguna). Disarankan agar logika ini tetap cepat dan bebas dari efek samping (jangan melakukan permintaan jaringan).

Contoh: Menampilkan pelengkapan `ctx.popup.*` hanya jika `popup.uid` ada.

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

Contoh: Popup tersedia tetapi menyembunyikan beberapa sub-jalur (hanya jalur relatif; misalnya menyembunyikan `record` dan `parent.record`).

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

Catatan: CodeEditor selalu mengaktifkan penyaringan pelengkapan berdasarkan `ctx` aktual (fail-open, tidak memunculkan error).

## 5. `info/meta` Runtime dan API Informasi Konteks (Untuk Pelengkapan dan LLM)

Selain memelihara dokumentasi `ctx` secara statis melalui `FlowRunJSContext.define()`, Anda juga dapat menyuntikkan **info/meta** saat runtime melalui `FlowContext.defineProperty/defineMethod`. Anda kemudian dapat mengeluarkan informasi konteks yang **dapat diserialisasi** untuk digunakan oleh CodeEditor atau LLM menggunakan API berikut:

- `await ctx.getApiInfos(options?)`: Informasi API statis.
- `await ctx.getVarInfos(options?)`: Informasi struktur variabel (bersumber dari `meta`, mendukung ekspansi jalur/maxDepth).
- `await ctx.getEnvInfos()`: Snapshot lingkungan runtime.

### 5.1 `defineMethod(name, fn, info?)`

`info` mendukung (semua opsional):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (seperti JSDoc)

> Catatan: `getApiInfos()` mengeluarkan dokumentasi API statis dan tidak akan menyertakan kolom seperti `deprecated`, `disabled`, atau `disabledReason`.

Contoh: Menyediakan tautan dokumentasi untuk `ctx.refreshTargets()`.

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: 'Menyegarkan data pada blok target',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: Digunakan untuk UI pemilih variabel (`getPropertyMetaTree` / `FlowContextSelector`). Ini menentukan visibilitas, struktur pohon, penonaktifan, dll. (mendukung fungsi/async).
  - Kolom umum: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: Digunakan untuk dokumentasi API statis (`getApiInfos`) dan deskripsi untuk LLM. Ini tidak memengaruhi UI pemilih variabel (mendukung fungsi/async).
  - Kolom umum: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

Ketika hanya `meta` yang disediakan (tanpa `info`):

- `getApiInfos()` tidak akan mengembalikan kunci ini (karena dokumentasi API statis tidak disimpulkan dari `meta`).
- `getVarInfos()` akan membangun struktur variabel berdasarkan `meta` (digunakan untuk pemilih variabel/pohon variabel dinamis).

### 5.3 API Informasi Konteks

Digunakan untuk mengeluarkan "informasi kemampuan konteks yang tersedia".

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // Dapat digunakan langsung dalam await ctx.getVar(getVar), disarankan diawali dengan "ctx."
  value?: any; // Nilai statis yang telah diurai (dapat diserialisasi, hanya dikembalikan jika dapat disimpulkan)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // Dokumentasi statis (tingkat atas)
type FlowContextVarInfos = Record<string, any>; // Struktur variabel (dapat diperluas berdasarkan jalur/maxDepth)
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

- `getApiInfos({ version })`: Versi dokumentasi RunJS (default ke `v1`).
- `getVarInfos({ path, maxDepth })`: Pemotongan dan kedalaman ekspansi maksimum (default ke 3).

Catatan: Hasil yang dikembalikan oleh API di atas tidak mengandung fungsi dan cocok untuk diserialisasi langsung ke LLM.

### 5.4 `await ctx.getVar(path)`

Ketika Anda hanya memiliki "string jalur variabel" (misalnya dari konfigurasi atau input pengguna) dan ingin mengambil nilai runtime dari variabel tersebut secara langsung, gunakan `getVar`:

- Contoh: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path` adalah jalur ekspresi yang diawali dengan `ctx.` (misalnya `ctx.record.id` / `ctx.record.roles[0].id`).

Tambahan: Metode atau properti yang diawali dengan garis bawah `_` dianggap sebagai anggota privat dan tidak akan muncul dalam output `getApiInfos()` atau `getVarInfos()`.