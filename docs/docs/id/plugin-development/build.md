:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pembangunan

## Konfigurasi Build Kustom

Jika Anda ingin menyesuaikan konfigurasi build, Anda dapat membuat berkas `build.config.ts` di direktori root `plugin` dengan isi sebagai berikut:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // Vite digunakan untuk membundel kode src/client

    // Ubah konfigurasi Vite, lihat: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup digunakan untuk membundel kode src/server

    // Ubah konfigurasi tsup, lihat: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // Fungsi callback yang berjalan sebelum proses build dimulai, memungkinkan Anda untuk melakukan operasi pra-build.
  },
  afterBuild: (log: PkgLog) => {
    // Fungsi callback yang berjalan setelah proses build selesai, memungkinkan Anda untuk melakukan operasi pasca-build.
  };
});
```