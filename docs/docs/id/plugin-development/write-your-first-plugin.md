---
title: "Menulis Plugin NocoBase Pertama"
description: "Membuat plugin Block dari nol: yarn pm create, skeleton plugin, direktori client/server, registrasi Block, alur development debug."
keywords: "menulis plugin,plugin pertama,yarn pm create,skeleton plugin,plugin Block,plugin development NocoBase"
---

# Menulis Plugin Pertama

Dokumen ini akan memandu Anda membuat plugin Block yang dapat digunakan di halaman dari nol, untuk membantu Anda memahami struktur dasar dan alur pengembangan plugin NocoBase.

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal NocoBase. Jika belum diinstal, Anda dapat merujuk pada:

- [Instalasi menggunakan create-nocobase-app](../get-started/installation/create-nocobase-app)
- [Instalasi dari source code Git](../get-started/installation/git)

Setelah instalasi selesai, Anda dapat memulai.

## Langkah 1: Membuat Skeleton Plugin melalui CLI

Jalankan perintah berikut di root direktori repository untuk dengan cepat menggenerate plugin kosong:

```bash
yarn pm create @my-project/plugin-hello
```

Setelah perintah berhasil dijalankan, file dasar akan digenerate di direktori `packages/plugins/@my-project/plugin-hello`, dengan struktur default sebagai berikut:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client-v2.d.ts
  ├─ client-v2.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Default ekspor plugin server
     ├─ client-v2                 # Lokasi penyimpanan kode client
     │  ├─ index.tsx             # Class plugin client yang diekspor secara default
     │  ├─ plugin.tsx            # Entry plugin (extends @nocobase/client-v2 Plugin)
     │  ├─ models                # Opsional: model front-end (seperti node flow)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Lokasi penyimpanan kode server
     │  ├─ index.ts              # Class plugin server yang diekspor secara default
     │  ├─ plugin.ts             # Entry plugin (extends @nocobase/server Plugin)
     │  ├─ collections           # Opsional: collections server
     │  ├─ migrations            # Opsional: migrasi data
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Opsional: multi-bahasa
        ├─ en-US.json
        └─ zh-CN.json
```

Setelah pembuatan selesai, Anda dapat mengakses halaman "Plugin Manager" di browser (alamat default: http://localhost:13000/admin/settings/plugin-manager) untuk memastikan plugin sudah muncul di daftar.

## Langkah 2: Mengimplementasikan Block Client Sederhana

Selanjutnya tambahkan model Block kustom ke plugin, untuk menampilkan teks selamat datang.

1. **Tambahkan file model Block** `client-v2/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client-v2';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **Daftarkan model Block**. Edit `client-v2/models/index.ts`, ekspor model baru tersebut untuk dimuat saat runtime front-end:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Setelah menyimpan kode, jika Anda menjalankan script development, Anda akan melihat log hot update di output terminal.

## Langkah 3: Aktifkan dan Coba Plugin

Anda dapat mengaktifkan plugin melalui command line atau antarmuka:

- **Command Line**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **Antarmuka Manajemen**: Akses "Plugin Manager", temukan `@my-project/plugin-hello`, klik "Aktifkan".

Setelah diaktifkan, buat halaman "Modern page (v2)" baru, saat menambahkan Block Anda akan melihat "Hello block", masukkan ke halaman dan Anda akan melihat konten selamat datang yang baru saja Anda tulis.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

### Membuat Plugin Default Preset atau Default Aktif (Opsional)

Di atas dijelaskan cara mengaktifkan plugin secara manual satu per satu. Jika Anda memelihara aplikasi NocoBase sendiri dan ingin beberapa plugin sudah siap secara otomatis setelah menjalankan `nocobase install` (instalasi pertama) atau `nocobase upgrade` (upgrade), Anda dapat menggunakan dua environment variable untuk mengontrol status default plugin:

- **`APPEND_PRESET_LOCAL_PLUGINS` (tambahkan plugin preset lokal default)** — Menambahkan plugin ke daftar plugin preset lokal; setelah instalasi akan muncul di "Plugin Manager", tetapi tidak aktif secara default dan perlu diaktifkan secara manual
- **`APPEND_PRESET_BUILT_IN_PLUGINS` (tambahkan plugin built-in default)** — Menambahkan plugin ke daftar plugin built-in; saat instalasi plugin diaktifkan secara otomatis, dan sebagai plugin built-in, **tidak dapat dinonaktifkan atau dihapus di "Plugin Manager"**

Nilai kedua variable ini adalah nama paket plugin (field `name` di `package.json`), pisahkan beberapa plugin dengan koma. Konfigurasi di file `.env` seperti berikut:

```bash
# Default preset: muncul di daftar Plugin Manager, tetapi tidak diaktifkan secara otomatis
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world

# Default aktif: diinstal dan diaktifkan secara otomatis, serta tidak dapat dinonaktifkan melalui antarmuka
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-hello,@my-project/plugin-hello-world
```

Pada umumnya, untuk pengembangan dan debugging lokal, `yarn pm enable` sudah cukup. Kedua variable ini lebih cocok untuk skenario distribusi "siap pakai" — misalnya Anda mengemas aplikasi NocoBase dengan plugin tertentu dan ingin plugin langsung tersedia setelah inisialisasi.

:::tip Tips

- Plugin harus sudah diunduh ke lokal dan dapat ditemukan di `node_modules`, lihat [Struktur Direktori Proyek](./project-structure.md)
- Setelah dikonfigurasi, perlu menjalankan ulang `nocobase install` atau `nocobase upgrade` agar perubahan berlaku
- Penjelasan lengkap environment variable lihat [Environment Variable](../get-started/installation/env.md#append_preset_local_plugins)

:::

## Langkah 4: Build & Packaging

Ketika Anda siap mendistribusikan plugin ke environment lain, Anda perlu build kemudian packaging:

```bash
yarn build @my-project/plugin-hello --tar
# atau jalankan dalam dua langkah
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

:::tip Tips

Jika plugin dibuat di repository source code, build pertama akan memicu pemeriksaan tipe untuk seluruh repository, yang mungkin memakan waktu cukup lama. Pastikan dependensi sudah terinstal dan repository dalam kondisi siap untuk dibuild.

:::

Setelah build selesai, file packaging secara default berada di `storage/tar/@my-project/plugin-hello.tar.gz`.

:::tip Tips

Sebelum plugin dirilis, disarankan untuk menulis test case untuk memvalidasi logika inti, NocoBase menyediakan toolchain test server yang lengkap. Lihat [Test Pengujian](./server/test.md).

:::

## Langkah 5: Upload ke Aplikasi NocoBase Lain

Upload dan ekstrak file packaging ke direktori `./storage/plugins` aplikasi target. Untuk langkah detail, lihat [Instalasi & Upgrade Plugin](../get-started/install-upgrade-plugins.mdx).

## Tautan Terkait

- [Ikhtisar Plugin Development](./index.md) — Memahami arsitektur microkernel NocoBase dan siklus hidup plugin
- [Struktur Direktori Proyek](./project-structure.md) — Konvensi direktori proyek, path dan prioritas loading plugin
- [Ikhtisar Pengembangan Server](./server/index.md) — Pengantar menyeluruh dan konsep inti plugin server
- [Ikhtisar Pengembangan Client](./client/index.md) — Pengantar menyeluruh dan konsep inti plugin client
- [Build & Packaging](./build.md) — Alur build, packaging, dan distribusi plugin
- [Test Pengujian](./server/test.md) — Menulis test case plugin server
- [Instalasi menggunakan create-nocobase-app](../get-started/installation/create-nocobase-app) — Salah satu cara instalasi NocoBase
- [Instalasi dari source code Git](../get-started/installation/git) — Instalasi NocoBase dari source code
- [Instalasi & Upgrade Plugin](../get-started/install-upgrade-plugins.mdx) — Upload plugin yang sudah di-package ke environment lain
- [Environment Variable](../get-started/installation/env.md) — Konfigurasi environment variable untuk plugin preset dan built-in