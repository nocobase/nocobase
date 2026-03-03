:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/flow-engine/flow-context).
:::

# Ikhtisar Sistem Konteks

Sistem konteks alur kerja NocoBase dibagi menjadi tiga lapisan, masing-masing sesuai dengan cakupan yang berbeda. Penggunaan yang tepat dapat mewujudkan berbagi dan isolasi layanan, konfigurasi, dan data yang fleksibel, serta meningkatkan pemeliharaan dan skalabilitas bisnis.

- **FlowEngineContext (Konteks Global)**: Unik secara global, dapat diakses oleh semua model dan alur kerja, cocok untuk mendaftarkan layanan global, konfigurasi, dll.
- **FlowModelContext (Konteks Model)**: Digunakan untuk berbagi konteks di dalam pohon model, sub-model secara otomatis mendelegasikan konteks model induk, mendukung penimpaan nama yang sama, cocok untuk isolasi logika dan data tingkat model.
- **FlowRuntimeContext (Konteks Runtime Alur Kerja)**: Dibuat setiap kali alur kerja dieksekusi, berlangsung sepanjang seluruh siklus berjalan alur kerja, cocok untuk transmisi data, penyimpanan variabel, perekaman status berjalan, dll. dalam alur kerja. Mendukung dua mode `mode: 'runtime' | 'settings'`, yang masing-masing sesuai dengan status berjalan dan status konfigurasi.

Semua `FlowEngineContext` (Konteks Global), `FlowModelContext` (Konteks Model), `FlowRuntimeContext` (Konteks Runtime Alur Kerja), dll., adalah subkelas atau instansi dari `FlowContext`.

---

## 🗂️ Diagram Hierarki

```text
FlowEngineContext (Konteks Global)
│
├── FlowModelContext (Konteks Model)
│     ├── Sub FlowModelContext (Sub-model)
│     │     ├── FlowRuntimeContext (Konteks Runtime Alur Kerja)
│     │     └── FlowRuntimeContext (Konteks Runtime Alur Kerja)
│     └── FlowRuntimeContext (Konteks Runtime Alur Kerja)
│
├── FlowModelContext (Konteks Model)
│     └── FlowRuntimeContext (Konteks Runtime Alur Kerja)
│
└── FlowModelContext (Konteks Model)
      ├── Sub FlowModelContext (Sub-model)
      │     └── FlowRuntimeContext (Konteks Runtime Alur Kerja)
      └── FlowRuntimeContext (Konteks Runtime Alur Kerja)
```

- `FlowModelContext` melalui mekanisme delegasi (delegate) dapat mengakses properti dan metode `FlowEngineContext`, mewujudkan berbagi kemampuan global.
- `FlowModelContext` dari sub-model melalui mekanisme delegasi (delegate) dapat mengakses konteks model induk (hubungan sinkron), mendukung penimpaan nama yang sama.
- Model induk-anak asinkron tidak akan membangun hubungan delegasi (delegate) untuk menghindari polusi status.
- `FlowRuntimeContext` selalu mengakses `FlowModelContext` yang sesuai melalui mekanisme delegasi (delegate), tetapi tidak akan mengirimkan kembali ke atas.

---

## 🧭 Status Berjalan dan Status Konfigurasi (mode)

`FlowRuntimeContext` mendukung dua mode, dibedakan melalui parameter `mode`:

- `mode: 'runtime'` (Status berjalan): Digunakan untuk tahap eksekusi aktual alur kerja, properti dan metode mengembalikan data nyata. Contoh:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Status konfigurasi): Digunakan untuk tahap desain dan konfigurasi alur kerja, akses properti mengembalikan string templat variabel, memudahkan ekspresi dan pemilihan variabel. Contoh:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Desain mode ganda ini tidak hanya menjamin ketersediaan data saat runtime, tetapi juga memudahkan referensi variabel dan pembuatan ekspresi saat konfigurasi, meningkatkan fleksibilitas dan kemudahan penggunaan alur kerja.

---

## 🤖 Informasi Konteks untuk Alat/Model Bahasa Besar (LLM)

Dalam skenario tertentu (misalnya pengeditan kode RunJS pada JS*Model, AI coding), "pemanggil" perlu memahami hal-hal berikut tanpa mengeksekusi kode:

- Apa saja **kemampuan statis** di bawah `ctx` saat ini (dokumentasi API, parameter, contoh, tautan dokumentasi, dll.)
- Apa saja **variabel opsional** pada antarmuka/status berjalan saat ini (misalnya struktur dinamis seperti "rekaman saat ini", "rekaman popup saat ini", dll.)
- **Snapshot volume kecil** dari lingkungan berjalan saat ini (digunakan untuk prompt)

### 1) `await ctx.getApiInfos(options?)` (Informasi API Statis)

### 2) `await ctx.getVarInfos(options?)` (Informasi Struktur Variabel)

- Dibangun berdasarkan `defineProperty(...).meta` (termasuk meta factory)
- Mendukung pemotongan `path` dan kontrol kedalaman `maxDepth`
- Hanya diperluas ke bawah saat diperlukan

Parameter umum:

- `maxDepth`: Tingkat perluasan maksimum (default 3)
- `path: string | string[]`: Pemotongan, hanya mengeluarkan sub-pohon jalur yang ditentukan

### 3) `await ctx.getEnvInfos()` (Snapshot Lingkungan Runtime)

Struktur simpul (disederhanakan):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Dapat digunakan langsung untuk await ctx.getVar(getVar), dimulai dengan "ctx."
  value?: any; // Nilai statis yang telah diurai/dapat diserialisasi
  properties?: Record<string, EnvNode>;
};
```