---
title: "Ikhtisar Pengembangan Plugin Client"
description: "Ikhtisar pengembangan plugin client NocoBase: alur pembelajaran utama Plugin → Router → Component → Context → FlowEngine, tabel index cepat membantu menemukan bagian."
keywords: "plugin client,Plugin,Router,Component,Context,FlowEngine,FlowModel,NocoBase"
---

# Ikhtisar

Plugin client NocoBase dapat melakukan banyak hal: mendaftarkan halaman baru, menulis Component kustom, memanggil API backend, menambahkan Block dan Field, bahkan memperluas tombol Action. Semua kapabilitas ini diorganisir melalui satu entry point plugin yang terpadu.

Jika Anda sudah memiliki pengalaman pengembangan React, Anda akan cepat memulai — sebagian besar skenario adalah menulis Component React biasa, dan menggunakan kapabilitas konteks yang disediakan NocoBase (seperti membuat request, internasionalisasi) untuk berinteraksi dengan NocoBase. Anda hanya perlu memahami [FlowEngine](./flow-engine/index.md) ketika Anda perlu Component Anda muncul di antarmuka konfigurasi visual NocoBase.

:::warning Perhatian

NocoBase sedang bermigrasi dari `client` (v1) ke `client-v2`, saat ini `client-v2` masih dalam pengembangan. Konten dalam dokumentasi ini disediakan untuk eksplorasi awal, tidak disarankan untuk langsung digunakan di environment production. Plugin yang baru dikembangkan harap menggunakan direktori `src/client-v2/` dan API `@nocobase/client-v2`.

:::

## Alur Pembelajaran

Disarankan untuk memahami pengembangan plugin client dalam urutan berikut, dari sederhana ke kompleks:

```
Plugin (entry) → Router (halaman) → Component → Context → FlowEngine (ekstensi UI)
```

Di mana:

1. **[Plugin](./plugin)**: Class entry plugin, mendaftarkan route, model, dan resource lainnya dalam siklus hidup `load()`, dll.
2. **[Router](./router)**: Mendaftarkan route halaman melalui `router.add()`, mendaftarkan halaman pengaturan plugin melalui `pluginSettingsManager`.
3. **[Component](./component/index.md)**: Yang di-mount oleh route adalah Component React. Default menggunakan React + Antd, sama dengan pengembangan front-end biasa.
4. **[Context](./ctx/index.md)**: Dalam plugin dapat mengakses konteks melalui `this.context`, dalam Component melalui `useFlowContext()`, kemudian dapat menggunakan kapabilitas yang disediakan NocoBase — membuat request (`ctx.api`), internasionalisasi (`ctx.t`), log (`ctx.logger`), dll.
5. **[FlowEngine](./flow-engine/index.md)**: Jika Component Anda perlu muncul di menu "Tambah Block / Field / Action", mendukung konfigurasi visual oleh pengguna, perlu menggunakan FlowModel untuk membungkusnya.

Empat langkah pertama mencakup sebagian besar skenario plugin. Hanya saat perlu integrasi mendalam dengan sistem konfigurasi UI NocoBase, baru perlu sampai ke langkah kelima. Tidak yakin cara mana yang harus digunakan, dapat melihat [Component vs FlowModel](./component-vs-flow-model).

## Index Cepat

| Saya ingin...                             | Lihat di mana                                                |
| ------------------------------------ | ------------------------------------------------------- |
| Memahami struktur dasar plugin client               | [Plugin](./plugin)                                 |
| Menambahkan halaman independen                     | [Router](./router)                                 |
| Menambahkan halaman pengaturan plugin                   | [Router](./router)                                 |
| Menulis Component React biasa                | [Pengembangan Component](./component/index.md)                       |
| Memanggil API backend, menggunakan kapabilitas bawaan NocoBase | [Context → Kapabilitas Umum](./ctx/common-capabilities)         |
| Menyesuaikan style Component                       | [Styles & Themes](./component/styles-themes) |
| Menambahkan Block baru                     | [FlowEngine → Ekstensi Block](./flow-engine/block)            |
| Menambahkan Component Field baru                 | [FlowEngine → Ekstensi Field](./flow-engine/field)            |
| Menambahkan tombol Action baru                 | [FlowEngine → Ekstensi Action](./flow-engine/action)           |
| Tidak yakin menggunakan Component atau FlowModel    | [Component vs FlowModel](./component-vs-flow-model)     |
| Melihat bagaimana plugin lengkap dibuat           | [Contoh Praktis Plugin](./examples/index.md)                              |

## Tautan Terkait

- [Menulis Plugin Pertama](../write-your-first-plugin) — Membuat plugin yang dapat berjalan dari nol
- [Ikhtisar Pengembangan Server](../server) — Plugin client biasanya perlu dipasangkan dengan server
- [Dokumentasi Lengkap FlowEngine](../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
- [Struktur Direktori Proyek](../project-structure) — File plugin diletakkan di mana
