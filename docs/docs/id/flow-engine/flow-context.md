
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Gambaran Umum Sistem Konteks

Sistem konteks pada NocoBase FlowEngine terbagi menjadi tiga lapisan, yang masing-masing memiliki cakupan (scope) berbeda. Penggunaan yang tepat dapat memungkinkan pembagian dan isolasi layanan, konfigurasi, serta data secara fleksibel, sehingga meningkatkan pemeliharaan dan skalabilitas bisnis.

- **FlowEngineContext (Konteks Global)**: Bersifat unik secara global, dapat diakses oleh semua model dan alur kerja, cocok untuk mendaftarkan layanan atau konfigurasi global.
- **FlowModelContext (Konteks Model)**: Digunakan untuk berbagi konteks di dalam pohon model. Sub-model secara otomatis mendelegasikan ke konteks model induk, mendukung penimpaan dengan nama yang sama. Cocok untuk isolasi logika dan data di tingkat model.
- **FlowRuntimeContext (Konteks Runtime Alur Kerja)**: Dibuat setiap kali sebuah alur kerja dieksekusi, dan berlangsung sepanjang siklus eksekusi alur kerja. Cocok untuk meneruskan data, menyimpan variabel, dan mencatat status runtime di dalam alur kerja. Mendukung dua mode: `mode: 'runtime' | 'settings'`, yang masing-masing sesuai dengan mode runtime dan mode pengaturan.

Semua `FlowEngineContext` (Konteks Global), `FlowModelContext` (Konteks Model), `FlowRuntimeContext` (Konteks Runtime Alur Kerja), dan lainnya, adalah subclass atau instance dari `FlowContext`.

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

- `FlowModelContext` dapat mengakses properti dan metode `FlowEngineContext` melalui mekanisme delegasi, memungkinkan pembagian kapabilitas global.
- `FlowModelContext` dari sub-model dapat mengakses konteks model induknya (hubungan sinkron) melalui mekanisme delegasi, mendukung penimpaan dengan nama yang sama.
- Model induk-anak asinkron tidak akan membentuk hubungan delegasi untuk menghindari polusi status.
- `FlowRuntimeContext` selalu mengakses `FlowModelContext` yang sesuai dengannya melalui mekanisme delegasi, tetapi tidak akan menyebarkan perubahan ke atas.

## 🧭 Mode Runtime dan Pengaturan (mode)

`FlowRuntimeContext` mendukung dua mode, yang dibedakan melalui parameter `mode`:

- `mode: 'runtime'` (Mode Runtime): Digunakan selama fase eksekusi alur kerja yang sebenarnya. Properti dan metode akan mengembalikan data riil. Contoh:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Mode Pengaturan): Digunakan selama fase desain dan konfigurasi alur kerja. Akses properti akan mengembalikan string template variabel, memfasilitasi pemilihan ekspresi dan variabel. Contoh:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Desain dua mode ini memastikan ketersediaan data saat runtime dan memfasilitasi referensi variabel serta pembuatan ekspresi selama konfigurasi, sehingga meningkatkan fleksibilitas dan kemudahan penggunaan FlowEngine.