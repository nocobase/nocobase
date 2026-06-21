---
title: "Ikhtisar Block Extension"
description: "Pengembangan Block Extension: extend Block kustom berbasis FlowModel, mendukung BlockModel, rendering, dan event flow."
keywords: "Block Extension,FlowModel,BlockModel,NocoBase"
---

# Ikhtisar Block Extension

Pada NocoBase 2.0, mekanisme Block extension telah disederhanakan secara signifikan. Developer hanya perlu meng-extend base class **FlowModel** yang sesuai dan mengimplementasikan method interface yang relevan (terutama method `renderComponent()`), untuk dengan cepat mengkustomisasi Block.

## Klasifikasi Block

NocoBase membagi Block menjadi tiga kategori, ditampilkan dalam grup pada antarmuka konfigurasi:

- **Data blocks**: Block yang meng-extend `DataBlockModel` atau `CollectionBlockModel`
- **Filter blocks**: Block yang meng-extend `FilterBlockModel`
- **Other blocks**: Block yang meng-extend `BlockModel` secara langsung

> Grup tempat Block berada ditentukan oleh base class yang sesuai. Logika penentuannya berbasis hubungan inheritance, tidak perlu konfigurasi tambahan.

## Penjelasan Base Class

Sistem menyediakan empat base class untuk extension:

### BlockModel

**Base block model**, base class Block yang paling umum.

- Cocok untuk Block tampilan murni yang tidak bergantung pada data
- Akan diklasifikasikan ke grup **Other blocks**
- Cocok untuk skenario yang dipersonalisasi

### DataBlockModel

**Data block model (tidak terikat ke tabel data)**, ditujukan untuk Block dengan data source kustom.

- Tidak terikat langsung ke tabel data, dapat mengkustomisasi logika pengambilan data
- Akan diklasifikasikan ke grup **Data blocks**
- Cocok untuk: memanggil API eksternal, pemrosesan data kustom, chart statistik, dll.

### CollectionBlockModel

**Collection block model**, Block yang perlu binding ke tabel data.

- Base class model yang perlu binding ke tabel data
- Akan diklasifikasikan ke grup **Data blocks**
- Cocok untuk: list, form, kanban, dan Block lainnya yang secara eksplisit bergantung pada tabel data tertentu

### FilterBlockModel

**Filter block model**, digunakan untuk membangun kondisi filter.

- Base class model yang digunakan untuk membangun kondisi filter
- Akan diklasifikasikan ke grup **Filter blocks**
- Biasanya berinteraksi dengan data block

## Cara Memilih Base Class

Saat memilih base class, Anda dapat mengikuti prinsip berikut:

- **Perlu binding ke tabel data tertentu**: Prioritaskan `CollectionBlockModel`
- **Data source kustom**: Pilih `DataBlockModel`
- **Digunakan untuk mengatur kondisi filter dan berinteraksi dengan data block**: Pilih `FilterBlockModel`
- **Tidak tahu cara mengklasifikasikan**: Pilih `BlockModel`

## Mulai Cepat

Membuat Block kustom hanya membutuhkan tiga langkah:

1. Extend base class yang sesuai (seperti `BlockModel`)
2. Implementasikan method `renderComponent()` yang mengembalikan React component
3. Daftarkan block model di plugin

Untuk contoh detail, lihat [Menulis Plugin Block](./write-a-block-plugin).
