:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menulis Plugin Pertama Anda

Panduan ini akan memandu Anda membuat sebuah plugin blok yang dapat digunakan di halaman, mulai dari nol. Ini akan membantu Anda memahami struktur dasar dan alur kerja pengembangan plugin NocoBase.

## Prasyarat

Sebelum memulai, pastikan Anda telah berhasil menginstal NocoBase. Jika belum, Anda dapat merujuk ke panduan instalasi berikut:

- [Instalasi menggunakan create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalasi dari sumber Git](/get-started/installation/git)

Setelah instalasi selesai, Anda dapat secara resmi memulai perjalanan pengembangan plugin Anda.

## Langkah 1: Membuat Kerangka Plugin melalui CLI

Jalankan perintah berikut di direktori root repositori untuk membuat plugin kosong dengan cepat:

```bash
yarn pm create @my-project/plugin-hello
```

Setelah perintah berhasil dijalankan, file dasar akan dibuat di direktori `packages/plugins/@my-project/plugin-hello`. Struktur default-nya adalah sebagai berikut:

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # Ekspor default plugin sisi server
     ├─ client                   # Lokasi kode sisi klien
     │  ├─ index.tsx             # Kelas plugin sisi klien yang diekspor secara default
     │  ├─ plugin.tsx            # Entri plugin (mewarisi @nocobase/client Plugin)
     │  ├─ models                # Opsional: model frontend (misalnya, node alur kerja)
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # Lokasi kode sisi server
     │  ├─ index.ts              # Kelas plugin sisi server yang diekspor secara default
     │  ├─ plugin.ts             # Entri plugin (mewarisi @nocobase/server Plugin)
     │  ├─ collections           # Opsional: koleksi sisi server
     │  ├─ migrations            # Opsional: migrasi data
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # Opsional: multibahasa
        ├─ en-US.json
        └─ zh-CN.json
```

Setelah pembuatan selesai, Anda dapat mengakses halaman manajer plugin di browser Anda (URL default: http://localhost:13000/admin/settings/plugin-manager) untuk memastikan apakah plugin telah muncul dalam daftar.

## Langkah 2: Mengimplementasikan Blok Klien Sederhana

Selanjutnya, kita akan menambahkan model blok kustom ke plugin untuk menampilkan pesan selamat datang.

1.  **Buat file model blok baru** `client/models/HelloBlockModel.tsx`:

```tsx pure
import { BlockModel } from '@nocobase/client';
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

2.  **Daftarkan model blok**. Edit `client/models/index.ts` untuk mengekspor model baru, agar dapat dimuat oleh runtime frontend:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

Setelah menyimpan kode, jika Anda sedang menjalankan skrip pengembangan, Anda akan melihat log hot-reload di output terminal.

## Langkah 3: Mengaktifkan dan Menguji Plugin

Anda dapat mengaktifkan plugin melalui baris perintah atau antarmuka:

-   **Baris Perintah**

    ```bash
    yarn pm enable @my-project/plugin-hello
    ```

-   **Antarmuka Manajemen**: Akses manajer plugin, temukan `@my-project/plugin-hello`, lalu klik "Aktifkan".

Setelah diaktifkan, buat halaman "Modern page (v2)" baru. Saat menambahkan blok, Anda akan melihat "Hello block". Sisipkan ke halaman untuk melihat konten selamat datang yang baru saja Anda tulis.

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## Langkah 4: Membangun dan Mengemas

Ketika Anda siap untuk mendistribusikan plugin ke lingkungan lain, Anda perlu membangun (build) dan mengemasnya (package) terlebih dahulu:

```bash
yarn build @my-project/plugin-hello --tar
# Atau jalankan dalam dua langkah
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> Catatan: Jika plugin dibuat di repositori sumber, build pertama akan memicu pemeriksaan tipe seluruh repositori, yang mungkin memakan waktu cukup lama. Disarankan untuk memastikan dependensi telah terinstal dan repositori berada dalam kondisi yang dapat dibangun (buildable).

Setelah build selesai, file paket secara default terletak di `storage/tar/@my-project/plugin-hello.tar.gz`.

## Langkah 5: Mengunggah ke Aplikasi NocoBase Lain

Unggah dan ekstrak ke direktori `./storage/plugins` aplikasi target. Untuk detailnya, lihat [Instalasi dan Peningkatan Plugin](../get-started/install-upgrade-plugins.mdx).