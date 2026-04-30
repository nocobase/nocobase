---
title: "FAQ & Panduan Troubleshooting"
description: "FAQ pengembangan plugin client NocoBase: plugin tidak ditampilkan, Block tidak muncul, terjemahan tidak berlaku, route tidak ditemukan, hot update tidak berlaku, error build packaging, gagal startup setelah deployment, dll."
keywords: "FAQ,FAQ,panduan troubleshooting,Troubleshooting,NocoBase,build,deployment,tar,axios"
---

# FAQ & Panduan Troubleshooting

Berikut adalah masalah yang lebih mudah dijumpai saat mengembangkan plugin client. Jika Anda menjumpai situasi "jelas-jelas sudah benar tapi tidak berfungsi", coba cari di sini terlebih dahulu.

## Terkait Plugin

### Plugin tidak terlihat di manajer setelah dibuat

Pastikan menjalankan `yarn pm create` bukan membuat direktori secara manual. `yarn pm create` selain menggenerate file, juga akan mendaftarkan plugin ke tabel `applicationPlugins` di database. Jika sudah membuat direktori secara manual, dapat menjalankan `yarn nocobase upgrade` untuk memindai ulang.

### Halaman tidak berubah setelah plugin diaktifkan

Periksa berdasarkan urutan berikut:

1. Pastikan menjalankan `yarn pm enable <pluginName>`
2. Refresh browser (terkadang perlu force refresh `Ctrl+Shift+R`)
3. Periksa apakah ada error di console browser

### Halaman tidak terupdate setelah memodifikasi kode

Untuk tipe file yang berbeda, perilaku hot update berbeda:

| Tipe File | Setelah modifikasi perlu |
| --- | --- |
| tsx/ts di `src/client-v2/` | Hot update otomatis, tidak perlu operasi |
| File terjemahan di `src/locale/` | **Restart aplikasi** |
| Menambah atau memodifikasi collection di `src/server/collections/` | Jalankan `yarn nocobase upgrade` |

Jika kode client diubah tetapi tidak hot update, coba refresh browser dulu.

## Terkait Route

### Route halaman yang didaftarkan tidak dapat diakses

Route NocoBase v2 secara default akan memiliki prefix `/v2`. Misalnya Anda mendaftarkan `path: '/hello'`, alamat akses sebenarnya adalah `/v2/hello`:

```ts
this.router.add('hello', {
  path: '/hello', // Akses sebenarnya -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

Untuk detail lihat [Router](../router).

### Halaman pengaturan plugin kosong saat diklik

Jika menu halaman pengaturan muncul tetapi konten kosong, biasanya disebabkan oleh salah satu dari dua alasan:

**Alasan satu: v1 client menggunakan `componentLoader`**

`componentLoader` adalah cara penulisan client-v2, v1 client harus menggunakan `Component` untuk langsung memasukkan Component:

```ts
// Salah: v1 client tidak mendukung componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// Benar: v1 client menggunakan Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**Alasan dua: Component halaman tidak diekspor menggunakan `export default`**

`componentLoader` memerlukan modul memiliki default export, terlewatkan `default` tidak dapat dimuat.

## Terkait Block

### Block kustom tidak terlihat di menu "Tambah Block"

Pastikan model didaftarkan di `load()`:

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

Jika menggunakan `registerModels` (cara penulisan non-loading sesuai kebutuhan), pastikan model diekspor dengan benar di `models/index.ts`.

### Setelah menambahkan Block, daftar pemilihan tabel data tidak ada tabel saya

Tabel yang didefinisikan melalui `defineCollection` adalah tabel internal server, secara default tidak akan muncul di daftar tabel data UI.

**Cara yang Direkomendasikan**: Tambahkan tabel data yang sesuai di "[Manajemen Data Source](../../../data-sources/data-source-main/index.md)" di antarmuka NocoBase, setelah konfigurasi field dan tipe interface, tabel akan otomatis muncul di daftar pemilihan tabel data Block.

Jika memang perlu didaftarkan dalam kode plugin (seperti skenario demo dalam plugin contoh), dapat mendaftarkan secara manual melalui `addCollection`, untuk detail lihat [Membuat Plugin Manajemen Data Front-Back End](../examples/fullstack-plugin). Perhatikan harus didaftarkan melalui mode `eventBus`, tidak boleh dipanggil langsung di `load()` — `ensureLoaded()` akan membersihkan dan mengatur ulang semua collection setelah `load()`.

### Block kustom hanya ingin terikat pada tabel data tertentu

Override `static filterCollection` pada model, hanya collection yang return `true` yang akan muncul di daftar pemilihan:

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## Terkait Field

### Component Field kustom tidak terlihat di dropdown menu "Component Field"

Periksa berdasarkan urutan berikut:

1. Pastikan memanggil `DisplayItemModel.bindModelToInterface('ModelName', ['input'])`, dan tipe interface cocok — misalnya `input` sesuai dengan field teks satu baris, `checkbox` sesuai dengan checkbox
2. Pastikan model didaftarkan di `load()` (`registerModels` atau `registerModelLoaders`)
3. Pastikan model field memanggil `define({ label })`

### Dropdown menu Component Field menampilkan nama class

Lupa memanggil `define({ label })` pada model field, tinggal tambahkan saja:

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

Sekaligus pastikan ada key yang sesuai di file terjemahan di `src/locale/`, jika tidak environment Tionghoa masih akan menampilkan teks asli Inggris.

## Terkait Action

### Tombol Action kustom tidak terlihat di "Konfigurasi Action"

Pastikan `static scene` yang benar diatur pada model:

| Nilai | Lokasi Muncul |
| --- | --- |
| `ActionSceneEnum.collection` | Action bar atas Block (seperti di samping tombol "Tambah Baru") |
| `ActionSceneEnum.record` | Kolom Action setiap baris tabel (seperti di samping "Edit", "Delete") |
| `ActionSceneEnum.both` | Muncul di kedua skenario |

### Klik tombol Action tidak ada respons

Pastikan `on` di `registerFlow` diset `'click'`:

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // Listen klik tombol
  steps: {
    doSomething: {
      async handler(ctx) {
        // Logika Anda
      },
    },
  },
});
```

:::warning Perhatian

`uiSchema` di `registerFlow` adalah UI panel konfigurasi (status pengaturan), bukan modal runtime. Jika Anda ingin menampilkan form modal setelah klik tombol, harus menggunakan `ctx.viewer.dialog()` di `handler` untuk membuka modal.

:::

## Terkait Internasionalisasi

### Terjemahan tidak berlaku

Alasan paling umum:

- **Pertama kali menambah** direktori atau file `src/locale/` — perlu restart aplikasi agar berlaku
- **Key terjemahan tidak konsisten** — pastikan key dan string di kode sepenuhnya konsisten, perhatikan spasi dan case
- **Component langsung menggunakan `ctx.t()`** — `ctx.t()` tidak otomatis menyuntikkan namespace plugin, di Component harus menggunakan hook `useT()` (import dari `locale.ts`)

### Salah skenario `tExpr()` dan `useT()` dan `this.t()`

Tiga method terjemahan ini memiliki skenario penggunaan yang berbeda, salah pakai akan error atau terjemahan tidak berlaku:

| Method | Digunakan di mana | Penjelasan |
| --- | --- | --- |
| `tExpr()` | Definisi statis seperti `define()`, `registerFlow()`, dll. | i18n belum diinisialisasi saat module dimuat, gunakan terjemahan tertunda |
| `useT()` | Internal Component React | Mengembalikan function terjemahan yang terikat namespace plugin |
| `this.t()` | Di `load()` Plugin | Otomatis menyuntikkan nama paket plugin sebagai namespace |

Untuk detail lihat [i18n Internasionalisasi](../component/i18n).

## Terkait API Request

### Request mengembalikan 403 Forbidden

Biasanya ACL di server tidak dikonfigurasi. Misalnya collection Anda bernama `todoItems`, perlu mengizinkan operasi yang sesuai di `load()` plugin server:

```ts
// Hanya izinkan query
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// Izinkan CRUD lengkap
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` berarti pengguna yang sudah login dapat mengakses. Jika tidak diatur `acl.allow`, secara default hanya administrator yang dapat mengoperasikan.

### Request mengembalikan 404 Not Found

Periksa berdasarkan urutan berikut:

- Jika menggunakan `defineCollection`, pastikan ejaan nama collection benar
- Jika menggunakan `resourceManager.define`, pastikan nama resource dan nama action keduanya benar
- Periksa format URL request — format API NocoBase adalah `resourceName:actionName`, seperti `todoItems:list`, `externalApi:get`

## Terkait Build dan Deployment

### `yarn build --tar` error "no paths specified to add to archive"

Error saat menjalankan `yarn build <pluginName> --tar`:

```bash
TypeError: no paths specified to add to archive
```

Tetapi menjalankan `yarn build <pluginName>` saja (tanpa `--tar`) normal.

Masalah ini biasanya karena `.npmignore` plugin **menggunakan sintaks negasi** (prefix `!` npm). Saat packaging `--tar`, NocoBase akan membaca setiap baris `.npmignore` dan menambahkan `!` di depan untuk mengkonversi ke pattern exclude `fast-glob`. Jika `.npmignore` Anda sudah menggunakan sintaks negasi, contoh:

```
*
!dist
!package.json
```

Setelah diproses akan menjadi `['!*', '!!dist', '!!package.json', '**/*']`. Di antaranya `!*` akan mengecualikan semua file level root (termasuk `package.json`), sementara `!!dist` tidak akan dikenali oleh `fast-glob` sebagai "menyertakan kembali dist" — negasi tidak berfungsi. Jika direktori `dist/` kebetulan kosong atau build tidak menghasilkan file, daftar file yang dikumpulkan akhirnya kosong, `tar` akan melempar error ini.

**Solusi:** Jangan menggunakan sintaks negasi di `.npmignore`, ganti hanya mendaftar direktori yang perlu dikecualikan:

```
/node_modules
/src
```

Logika packaging akan mengkonversi ini menjadi pattern exclude (`!./node_modules`, `!./src`), ditambah `**/*` untuk match semua file lainnya. Ini sederhana dan tidak akan menemui masalah penanganan negasi.

### Plugin gagal diaktifkan setelah diupload ke environment production (lokal normal)

Plugin saat development lokal semuanya normal, tetapi setelah diupload ke environment production melalui "Plugin Manager" gagal diaktifkan, log muncul error mirip:

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

Masalah ini biasanya karena **plugin mengemas dependensi bawaan NocoBase ke dalam `node_modules/`-nya sendiri**. Sistem build NocoBase memiliki [daftar external](../../dependency-management), paket-paket di dalamnya (seperti `react`, `antd`, `axios`, `lodash`, dll.) disediakan oleh host NocoBase, tidak boleh dikemas ke dalam plugin. Jika plugin membawa salinan privat, runtime mungkin akan konflik dengan versi yang sudah dimuat oleh host, menyebabkan berbagai error aneh.

**Mengapa lokal tidak bermasalah:** Saat development lokal plugin berada di direktori `packages/plugins/`, tanpa `node_modules/` privat, dependensi akan resolve ke versi yang sudah dimuat di direktori root proyek, tidak akan menghasilkan konflik.

**Solusi:** Pindahkan semua `dependencies` di `package.json` plugin ke `devDependencies` — sistem build NocoBase akan otomatis menangani dependensi plugin:

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

Kemudian rebuild dan packaging. Dengan cara ini `dist/node_modules/` plugin tidak akan berisi paket-paket ini, runtime akan menggunakan versi yang disediakan oleh host NocoBase.

:::tip Prinsip Umum

Sistem build NocoBase memiliki [daftar external](../../dependency-management), paket-paket di dalamnya (seperti `react`, `antd`, `axios`, `lodash`, dll.) disediakan oleh host NocoBase, plugin tidak boleh mengemas sendiri. Semua dependensi plugin harus ditempatkan di `devDependencies`, sistem build akan otomatis menentukan mana yang perlu dikemas ke `dist/node_modules/`, mana yang disediakan oleh host.

:::

## Tautan Terkait

- [Plugin](../plugin) — Entry dan siklus hidup plugin
- [Router](../router) — Registrasi route dan prefix `/v2`
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel
- [FlowEngine → Ekstensi Block](../flow-engine/block) — BlockModel, TableBlockModel, filterCollection
- [FlowEngine → Ekstensi Field](../flow-engine/field) — FieldModel, bindModelToInterface
- [FlowEngine → Ekstensi Action](../flow-engine/action) — ActionModel, ActionSceneEnum
- [i18n Internasionalisasi](../component/i18n) — File terjemahan, useT, penggunaan tExpr
- [Context → Kapabilitas Umum](../ctx/common-capabilities) — ctx.api, ctx.viewer, dll.
- [Server → Collections Tabel Data](../../server/collections) — defineCollection dan addCollection
- [Server → ACL Kontrol Hak Akses](../../server/acl) — Konfigurasi hak akses API
- [Build Plugin](../../build) — Konfigurasi build, daftar external, alur packaging
