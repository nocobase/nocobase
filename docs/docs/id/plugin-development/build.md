---
title: "Build & Packaging"
description: "Build dan packaging plugin NocoBase: yarn build, yarn nocobase tar, konfigurasi kustom build.config.ts, packaging client Rsbuild, packaging server tsup."
keywords: "build plugin,packaging plugin,yarn build,tar,build.config.ts,Rsbuild,tsup,@nocobase/build,NocoBase"
---

# Build & Packaging

Setelah pengembangan plugin selesai, Anda perlu melalui dua tahap yaitu build (mengompilasi source code) dan packaging (menghasilkan `.tar.gz`) sebelum dapat didistribusikan ke aplikasi NocoBase lainnya.

## Build Plugin

Build akan mengompilasi source code TypeScript di bawah `src/` menjadi JavaScript — kode client dipaketkan oleh Rsbuild, sedangkan kode server dipaketkan oleh tsup:

```bash
yarn build @my-project/plugin-hello
```

Hasil build akan dikeluarkan ke direktori `dist/` di root plugin.

:::tip Tips

Jika plugin dibuat di repository source code, build pertama akan memicu pemeriksaan tipe untuk seluruh repository, yang mungkin memakan waktu cukup lama. Pastikan dependensi sudah terinstal dan repository dalam kondisi siap untuk dibuild.

:::

## Packaging Plugin

Packaging akan mengompresi hasil build menjadi sebuah file `.tar.gz`, memudahkan upload ke environment lain:

```bash
yarn nocobase tar @my-project/plugin-hello
```

File hasil packaging secara default dikeluarkan ke `storage/tar/@my-project/plugin-hello.tar.gz`.

Anda juga dapat menggunakan parameter `--tar` untuk menggabungkan build dan packaging menjadi satu langkah:

```bash
yarn build @my-project/plugin-hello --tar
```

## Upload ke Aplikasi NocoBase Lain

Cukup upload dan ekstrak file `.tar.gz` ke direktori `./storage/plugins` aplikasi target. Untuk langkah detail, lihat [Instalasi & Upgrade Plugin](../get-started/install-upgrade-plugins.mdx).

## Konfigurasi Build Kustom

Umumnya konfigurasi build default sudah cukup. Jika Anda perlu melakukan kustomisasi — misalnya mengubah entry packaging, menambah alias, mengatur opsi kompresi, dan sebagainya — Anda dapat membuat file `build.config.ts` di root direktori plugin:

```ts
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyRsbuildConfig: (config) => {
    // Modifikasi konfigurasi packaging Rsbuild untuk client (src/client-v2)
    // Referensi: https://rsbuild.rs/guide/configuration/rsbuild
    return config;
  },
  modifyTsupConfig: (config) => {
    // Modifikasi konfigurasi packaging tsup untuk server (src/server)
    // Referensi: https://tsup.egoist.dev/#using-custom-configuration
    return config;
  },
  beforeBuild: (log) => {
    // Callback sebelum build dimulai, misalnya membersihkan file sementara, menggenerate kode, dll.
  },
  afterBuild: (log) => {
    // Callback setelah build selesai, misalnya menyalin resource tambahan, menampilkan info statistik, dll.
  },
});
```

Beberapa poin kunci:

- `modifyRsbuildConfig` — Digunakan untuk menyesuaikan packaging client, seperti menambah plugin Rsbuild, memodifikasi alias resolve, mengatur strategi code splitting, dll. Untuk opsi konfigurasi lihat [dokumentasi Rsbuild](https://rsbuild.rs/guide/configuration/rsbuild)
- `modifyTsupConfig` — Digunakan untuk menyesuaikan packaging server, seperti memodifikasi target, externals, entry, dll. Untuk opsi konfigurasi lihat [dokumentasi tsup](https://tsup.egoist.dev/#using-custom-configuration)
- `beforeBuild` / `afterBuild` — Hook sebelum dan sesudah build, menerima fungsi `log` untuk menampilkan log. Misalnya generate file kode di `beforeBuild`, atau salin resource statis ke direktori output di `afterBuild`

## Tautan Terkait

- [Menulis Plugin Pertama](./write-your-first-plugin.md) — Membuat plugin dari nol, termasuk alur build dan packaging lengkap
- [Struktur Direktori Proyek](./project-structure.md) — Memahami fungsi direktori `packages/plugins`, `storage/tar`, dll.
- [Manajemen Dependensi](./dependency-management.md) — Deklarasi dependensi plugin dan dependensi global
- [Ikhtisar Plugin Development](./index.md) — Pengantar menyeluruh tentang plugin development
- [Instalasi & Upgrade Plugin](../get-started/install-upgrade-plugins.mdx) — Upload file hasil packaging ke environment target
