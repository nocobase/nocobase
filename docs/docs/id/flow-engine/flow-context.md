---
title: "Sistem Context FlowEngine"
description: "Sistem context FlowEngine: FlowContext, DataSourceManager, manajemen resource, memahami runtime context dan data source FlowEngine."
keywords: "FlowContext,Sistem context,DataSourceManager,Manajemen resource,Runtime FlowEngine,NocoBase"
---

# Ikhtisar Sistem Context

Sistem context dari NocoBase Flow Engine terbagi menjadi tiga lapisan, masing-masing sesuai dengan scope yang berbeda. Penggunaan yang tepat dapat mewujudkan berbagi dan isolasi service, konfigurasi, serta data secara fleksibel, sehingga meningkatkan kemudahan pemeliharaan bisnis dan kemampuan ekspansi.

- **FlowEngineContext (Context Global)**: Bersifat unik secara global, dapat diakses oleh semua model dan flow, cocok untuk mendaftarkan service global, konfigurasi, dan sebagainya.
- **FlowModelContext (Context Model)**: Digunakan untuk berbagi context di dalam model tree, sub-model secara otomatis mem-proxy context parent model, mendukung override dengan nama yang sama, cocok untuk isolasi logika dan data pada level model.
- **FlowRuntimeContext (Context Runtime Flow)**: Dibuat setiap kali flow dieksekusi, melingkupi seluruh siklus run flow, cocok untuk transfer data dalam flow, penyimpanan variabel, pencatatan status running, dan sebagainya. Mendukung dua mode: `mode: 'runtime' | 'settings'`, masing-masing sesuai dengan mode runtime dan mode konfigurasi.

Semua `FlowEngineContext` (Context Global), `FlowModelContext` (Context Model), `FlowRuntimeContext` (Context Runtime Flow), dan sejenisnya, adalah subclass atau instance dari `FlowContext`.

---

## 🗂️ Diagram Struktur Hirarki

```text
FlowEngineContext (Context Global)
│
├── FlowModelContext (Context Model)
│     ├── Sub FlowModelContext (Sub-model)
│     │     ├── FlowRuntimeContext (Context Runtime Flow)
│     │     └── FlowRuntimeContext (Context Runtime Flow)
│     └── FlowRuntimeContext (Context Runtime Flow)
│
├── FlowModelContext (Context Model)
│     └── FlowRuntimeContext (Context Runtime Flow)
│
└── FlowModelContext (Context Model)
      ├── Sub FlowModelContext (Sub-model)
      │     └── FlowRuntimeContext (Context Runtime Flow)
      └── FlowRuntimeContext (Context Runtime Flow)
```

- `FlowModelContext` melalui mekanisme proxy (delegate) dapat mengakses properti dan metode `FlowEngineContext`, mewujudkan berbagi kemampuan global.
- `FlowModelContext` sub-model melalui mekanisme proxy (delegate) dapat mengakses context parent model (hubungan sinkron), mendukung override dengan nama yang sama.
- Parent dan sub-model asynchronous tidak akan membentuk hubungan proxy (delegate), untuk menghindari polusi state.
- `FlowRuntimeContext` selalu mengakses `FlowModelContext` yang bersesuaian melalui mekanisme proxy (delegate), tetapi tidak akan mengirim balik ke atas.

---

## 🧭 Mode Runtime dan Konfigurasi (mode)

`FlowRuntimeContext` mendukung dua mode, dibedakan melalui parameter `mode`:

- `mode: 'runtime'` (Mode Runtime): Digunakan pada tahap eksekusi flow yang sebenarnya, properti dan metode mengembalikan data nyata. Contoh:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Mode Konfigurasi): Digunakan pada tahap desain dan konfigurasi flow, akses properti mengembalikan string template variabel, memudahkan pemilihan variabel dan ekspresi. Contoh:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Desain dual-mode ini memastikan ketersediaan data saat runtime, sekaligus memudahkan referensi variabel dan generasi ekspresi saat konfigurasi, meningkatkan fleksibilitas dan kemudahan penggunaan flow engine.

---

## 🤖 Informasi Context untuk Tools/Large Model

Pada skenario tertentu (misalnya editing kode RunJS dari JS*Model, AI coding), kita perlu memungkinkan "pemanggil" untuk memahami tanpa mengeksekusi kode:

- Pada `ctx` saat ini ada **kemampuan statis** apa saja (dokumentasi API, parameter, contoh, link dokumentasi, dan sebagainya)
- Pada UI/runtime saat ini ada **variabel opsional** apa saja (misalnya "record saat ini", "record popup saat ini", dan struktur dinamis lainnya)
- **Snapshot kecil** dari environment runtime saat ini (digunakan untuk prompt)

### 1) `await ctx.getApiInfos(options?)` (Informasi API Statis)

### 2) `await ctx.getVarInfos(options?)` (Informasi Struktur Variabel)

- Membangun struktur variabel berdasarkan `defineProperty(...).meta` (termasuk meta factory)
- Mendukung pemotongan `path` dan kontrol kedalaman `maxDepth`
- Hanya melakukan ekspansi ke bawah jika diperlukan

Parameter umum:

- `maxDepth`: Level ekspansi maksimum (default 3)
- `path: string | string[]`: Pemotongan, hanya menghasilkan output sub-tree pada path yang ditentukan

### 3) `await ctx.getEnvInfos()` (Snapshot Environment Runtime)

Struktur node (disederhanakan):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Dapat langsung digunakan untuk await ctx.getVar(getVar), diawali dengan "ctx."
  value?: any; // Nilai statis yang sudah di-resolve/dapat di-serialize
  properties?: Record<string, EnvNode>;
};
```
