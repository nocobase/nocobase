---
title: "Cheatsheet Plugin Development"
description: "Cheatsheet plugin development NocoBase: lakukan apa → di file mana → panggil API apa, dengan cepat menemukan di mana meletakkan kode."
keywords: "cheatsheet,Cheatsheet,cara registrasi,lokasi file,NocoBase"
---

# Cheatsheet Plugin Development

Saat menulis plugin, sering muncul pertanyaan "barang ini sebenarnya harus ditulis di file mana, panggil API mana". Cheatsheet ini membantu Anda menemukan dengan cepat.

## Struktur Direktori Plugin

Membuat plugin melalui `yarn pm create @my-project/plugin-name`, akan otomatis menggenerate struktur direktori berikut. Jangan membuat direktori secara manual, untuk menghindari langkah registrasi yang terlewatkan menyebabkan plugin tidak berfungsi. Untuk detail lihat [Menulis Plugin Pertama](../../write-your-first-plugin).

```bash
plugin-name/
├── src/
│   ├── client-v2/              # Kode client (v2)
│   │   ├── plugin.tsx          # Entry plugin client
│   │   ├── locale.ts           # Hook terjemahan useT / tExpr
│   │   ├── models/             # FlowModel (Block, Field, Action)
│   │   └── pages/              # Component halaman
│   ├── client/                 # Kode client (v1, kompatibilitas)
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # Kode server
│   │   ├── plugin.ts           # Entry plugin server
│   │   └── collections/        # Definisi tabel data
│   └── locale/                 # File terjemahan multi-bahasa
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # Entry direktori root (mengarah ke hasil build)
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Client: Saya Ingin Lakukan Apa → Cara Menulis

| Saya ingin lakukan apa | Tulis di file mana | Panggil API apa | Dokumentasi |
| --- | --- | --- | --- |
| Mendaftarkan route halaman | `load()` di `plugin.tsx` | `this.router.add()` | [Router](../router) |
| Mendaftarkan halaman pengaturan plugin | `load()` di `plugin.tsx` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Mendaftarkan Block kustom | `load()` di `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Ekstensi Block](../flow-engine/block) |
| Mendaftarkan Field kustom | `load()` di `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Ekstensi Field](../flow-engine/field) |
| Mendaftarkan Action kustom | `load()` di `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Ekstensi Action](../flow-engine/action) |
| Membuat tabel internal muncul di pemilihan tabel data Block | `load()` di `plugin.tsx` | `mainDS.addCollection()` | [Collections Tabel Data](../../server/collections) |
| Menerjemahkan teks plugin | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n Internasionalisasi](../component/i18n) |

## Server: Saya Ingin Lakukan Apa → Cara Menulis

| Saya ingin lakukan apa | Tulis di file mana | Panggil API apa | Dokumentasi |
| --- | --- | --- | --- |
| Mendefinisikan tabel data | `server/collections/xxx.ts` | `defineCollection()` | [Collections Tabel Data](../../server/collections) |
| Memperluas tabel data yang ada | `server/collections/xxx.ts` | `extendCollection()` | [Collections Tabel Data](../../server/collections) |
| Mendaftarkan API kustom | `load()` di `server/plugin.ts` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Mengkonfigurasi hak akses API | `load()` di `server/plugin.ts` | `this.app.acl.allow()` | [ACL Kontrol Hak Akses](../../server/acl) |
| Menulis data awal saat plugin diinstal | `install()` di `server/plugin.ts` | `this.db.getRepository().create()` | [Plugin](../../server/plugin) |

## Cheatsheet FlowModel

| Saya ingin lakukan apa | Extends class apa | API kunci |
| --- | --- | --- |
| Membuat Block tampilan murni | `BlockModel` | `renderComponent()` + `define()` |
| Membuat Block yang terikat tabel data (rendering kustom) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Membuat Block tabel lengkap (kustomisasi berdasarkan tabel bawaan) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Membuat Component tampilan field | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Membuat tombol Action | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Cheatsheet Method Terjemahan

| Skenario | Gunakan | Import dari mana |
| --- | --- | --- |
| Di `load()` Plugin | `this.t('key')` | Bawaan class Plugin |
| Di Component React | `const t = useT(); t('key')` | `locale.ts` |
| Definisi statis FlowModel (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Cheatsheet Panggilan API Umum

| Saya ingin lakukan apa | Di Plugin | Di Component |
| --- | --- | --- |
| Membuat API request | `this.context.api.request()` | `ctx.api.request()` |
| Mendapatkan terjemahan | `this.t()` | `useT()` |
| Mendapatkan log | `this.context.logger` | `ctx.logger` |
| Mendaftarkan route | `this.router.add()` | — |
| Navigasi halaman | — | `ctx.router.navigate()` |
| Membuka modal | — | `ctx.viewer.dialog()` |

## Tautan Terkait

- [Ikhtisar Pengembangan Client](../index.md) — Alur pembelajaran dan index cepat
- [Plugin](../plugin) — Entry dan siklus hidup plugin
- [FAQ & Panduan Troubleshooting](./faq) — Panduan troubleshooting
- [Router](../router) — Registrasi route halaman
- [FlowEngine → Ekstensi Block](../flow-engine/block) — Class dasar series BlockModel
- [FlowEngine → Ekstensi Field](../flow-engine/field) — Pengembangan FieldModel
- [FlowEngine → Ekstensi Action](../flow-engine/action) — Pengembangan ActionModel
- [Collections Tabel Data](../../server/collections) — defineCollection dan tipe field
- [i18n Internasionalisasi](../component/i18n) — Cara penulisan file terjemahan
- [ResourceManager Manajemen Resource](../../server/resource-manager) — REST API kustom
- [ACL Kontrol Hak Akses](../../server/acl) — Konfigurasi hak akses
- [Plugin (Server)](../../server/plugin) — Siklus hidup plugin server
- [Menulis Plugin Pertama](../../write-your-first-plugin) — Pembuatan skeleton plugin
