---
title: "Contoh Praktis Plugin"
description: "Studi kasus praktis lengkap plugin client NocoBase: halaman pengaturan, Block kustom, integrasi front-back end, Field kustom, plugin lengkap dari nol hingga selesai."
keywords: "contoh plugin,studi kasus,plugin lengkap,NocoBase"
---

# Contoh Praktis Plugin

Bab-bab sebelumnya secara terpisah memperkenalkan kapabilitas seperti [Plugin](../plugin), [Router](../router), [Component](../component/index.md), [Context](../ctx/index.md), [FlowEngine](../flow-engine/index.md), dll. Bab ini menggabungkan semuanya — melalui beberapa contoh praktis lengkap, menunjukkan seluruh proses plugin dari pembuatan hingga selesai.

Setiap contoh sesuai dengan plugin contoh yang dapat dijalankan, Anda dapat langsung melihat source code atau menjalankannya secara lokal.

## Daftar Contoh

| Contoh | Kapabilitas yang Terlibat | Tingkat Kesulitan |
| --- | --- | --- |
| [Membuat Halaman Pengaturan Plugin](./settings-page) | Plugin + Router + Component + Context + Server | Pemula |
| [Membuat Block Tampilan Kustom](./custom-block) | Plugin + FlowEngine (BlockModel) | Pemula |
| [Membuat Component Field Kustom](./custom-field) | Plugin + FlowEngine (FieldModel) | Pemula |
| [Membuat Tombol Action Kustom](./custom-action) | Plugin + FlowEngine (ActionModel) | Pemula |
| [Membuat Plugin Manajemen Data Front-Back End](./fullstack-plugin) | Plugin + FlowEngine (TableBlockModel + FieldModel + ActionModel) + Server | Lanjutan |

Disarankan dibaca berurutan. Contoh pertama menggunakan Component React + endpoint server sederhana, tidak melibatkan FlowEngine; tiga contoh berikutnya secara terpisah mendemonstrasikan tiga class dasar Block, Field, Action FlowEngine; contoh terakhir menggabungkan Block, Field, Action yang dipelajari sebelumnya, ditambah tabel data server, membentuk plugin integrasi front-back end yang lengkap. Jika Anda masih tidak yakin menggunakan Component React atau FlowModel, dapat melihat dulu [Component vs FlowModel](../component-vs-flow-model).

## Tautan Terkait

- [Menulis Plugin Pertama](../../write-your-first-plugin) — Membuat plugin yang dapat berjalan dari nol
- [Ikhtisar Pengembangan Client](../index.md) — Alur pembelajaran dan index cepat
- [Ikhtisar FlowEngine](../flow-engine/index.md) — Penggunaan dasar FlowModel dan registerFlow
- [Dokumentasi Lengkap FlowEngine](../../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
- [Component vs FlowModel](../component-vs-flow-model) — Memilih Component atau FlowModel
