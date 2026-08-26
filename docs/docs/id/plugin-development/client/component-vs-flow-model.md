---
title: "Component vs FlowModel"
description: "Panduan pemilihan pengembangan NocoBase: kapan menggunakan Component React biasa, kapan menggunakan FlowModel, perbedaan kapabilitas, perbandingan siklus hidup, dan pemilihan skenario."
keywords: "Component,FlowModel,panduan pemilihan,Component React,konfigurasi visual,model tree,NocoBase"
---

# Component vs FlowModel

Dalam pengembangan plugin NocoBase, ada dua cara untuk menulis UI front-end: **Component React biasa** dan **[FlowModel](../../flow-engine/index.md)**. Keduanya bukan hubungan saling menggantikan — FlowModel adalah lapisan enkapsulasi di atas Component React, menambahkan kapabilitas konfigurasi visual pada Component.

Biasanya, Anda tidak perlu terlalu lama berpikir. Tanyakan pada diri sendiri satu pertanyaan:

> **Apakah Component ini perlu muncul di menu "Tambah Block / Field / Action" NocoBase, agar pengguna dapat melakukan konfigurasi visual di antarmuka?**

- **Tidak perlu** → Gunakan Component React biasa, ini adalah pengembangan React standar
- **Perlu** → Bungkus dengan FlowModel

## Solusi Default: Component React

Sebagian besar skenario plugin cukup menggunakan Component React biasa. Misalnya:

- Mendaftarkan halaman independen (halaman pengaturan plugin, halaman route kustom)
- Menulis modal, form, list, dan Component internal lainnya
- Mengenkapsulasi Component UI utility

Dalam skenario ini, gunakan React + Antd untuk menulis Component, dapatkan kapabilitas konteks NocoBase melalui `useFlowContext()` (membuat request, internasionalisasi, dll.), tidak ada bedanya dengan pengembangan front-end biasa.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MySettingsPage() {
  const ctx = useFlowContext();

  return (
    <div>
      <h2>{ctx.t('Plugin settings')}</h2>
      {/* Component React biasa, tidak perlu FlowModel */}
    </div>
  );
}
```

Untuk penggunaan detail lihat [Pengembangan Component](./component/index.md).

## Kapan Menggunakan FlowModel

Ketika Component Anda perlu memenuhi kondisi berikut, gunakan FlowModel:

1. **Muncul di menu**: Perlu memungkinkan pengguna menambahkan melalui menu "Tambah Block", "Tambah Field", "Tambah Action"
2. **Mendukung konfigurasi visual**: Pengguna dapat mengklik item konfigurasi di antarmuka untuk memodifikasi property Component (seperti memodifikasi judul, mengganti mode tampilan)
3. **Konfigurasi perlu dipersistensi**: Konfigurasi pengguna perlu disimpan, masih ada saat halaman dibuka kembali

Sederhananya, FlowModel menyelesaikan masalah "membuat Component dapat dikonfigurasi, dapat dipersistensi". Jika Component Anda tidak memerlukan kapabilitas ini, Anda tidak perlu menggunakannya.

## Hubungan Antara Keduanya

FlowModel bukan untuk "menggantikan" Component React. Ini adalah lapisan abstraksi di atas Component React:

```
Component React: Bertanggung jawab merender UI
    ↓ Bungkus
FlowModel: Mengelola sumber props, panel konfigurasi, persistensi konfigurasi
```

Method `render()` dari sebuah FlowModel berisi kode React biasa. Perbedaannya: props Component biasa di-hardcode atau dilewatkan dari Component parent, props FlowModel di-generate dinamis melalui Flow (alur konfigurasi).

Sebenarnya, keduanya memiliki struktur dasar yang sangat mirip:

```tsx pure
// Component React
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}

// FlowModel
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

Namun cara manajemennya sepenuhnya berbeda. Component React mengandalkan JSX nesting untuk membentuk **component tree** — ini adalah tree rendering UI runtime. FlowModel dikelola oleh [FlowEngine](../../flow-engine/index.md), membentuk **model tree** — sebuah tree struktur logis yang dapat dipersistensi dan didaftarkan secara dinamis, melalui `setSubModel` / `addSubModel` mengontrol hubungan parent-child secara eksplisit, cocok untuk membangun struktur seperti Block halaman, alur operasi, model data yang memerlukan manajemen konfigurasi.

## Perbandingan Kapabilitas

Dari perspektif yang lebih teknis, perbedaan keduanya:

| Kapabilitas | Component React | FlowModel |
| --- | --- | --- |
| Render UI | `render()` | `render()` |
| Manajemen Status | Built-in `state` / `setState` | Dikelola melalui struktur `props` dan model tree |
| Siklus Hidup | `constructor`, `componentDidMount`, `componentWillUnmount` | `onInit`, `onMount`, `onUnmount` |
| Merespons Perubahan Input | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| Penanganan Error | `componentDidCatch` | `onAutoFlowsError` |
| Sub Component | Nesting JSX | `setSubModel` / `addSubModel` mengatur sub model secara eksplisit |
| Perilaku Dinamis | Event binding, update status | Mendaftarkan dan mendispatch Flow |
| Persistensi | Tidak ada mekanisme bawaan | `model.save()`, dll., terhubung dengan backend |
| Reuse Multi Instance | Perlu ditangani manual | `createFork` — seperti setiap baris tabel |
| Manajemen Engine | Tidak ada | Didaftarkan, dimuat, dikelola secara terpadu oleh FlowEngine |

Jika Anda terbiasa dengan siklus hidup React, siklus hidup FlowModel mudah dipetakan — `onInit` sesuai dengan `constructor`, `onMount` sesuai dengan `componentDidMount`, `onUnmount` sesuai dengan `componentWillUnmount`.

Selain itu, FlowModel juga menyediakan kapabilitas yang tidak dimiliki Component React:

- **`registerFlow`** — Mendaftarkan Flow, mendefinisikan alur konfigurasi
- **`applyFlow` / `dispatchEvent`** — Mengeksekusi atau memicu Flow
- **`openFlowSettings`** — Membuka panel pengaturan langkah Flow
- **`save` / `saveStepParams()`** — Mempersistensi konfigurasi model
- **`createFork`** — Sebuah logika model di-render banyak kali secara reuse (seperti setiap baris tabel)

Kapabilitas ini adalah dasar yang mendukung pengalaman "konfigurasi visual". Jika skenario Anda tidak melibatkan konfigurasi visual, tidak perlu memperhatikannya. Untuk penggunaan detail lihat [Dokumentasi Lengkap FlowEngine](../../flow-engine/index.md).

## Perbandingan Skenario

| Skenario | Solusi | Alasan |
| --- | --- | --- |
| Halaman pengaturan plugin | Component React | Halaman independen, tidak perlu muncul di menu konfigurasi |
| Modal utility | Component React | Component internal, tidak perlu konfigurasi visual |
| Block tabel data kustom | FlowModel | Perlu muncul di menu "Tambah Block", pengguna dapat mengkonfigurasi data source |
| Component tampilan field kustom | FlowModel | Perlu muncul di konfigurasi field, pengguna dapat memilih cara tampilan |
| Tombol Action kustom | FlowModel | Perlu muncul di menu "Tambah Action" |
| Mengenkapsulasi Component chart untuk Block | Component React | Chart sendiri adalah Component internal, dipanggil oleh Block FlowModel |

## Adopsi Bertahap

Ketika tidak yakin, implementasikan fungsi dengan Component React terlebih dahulu. Setelah memastikan perlu kapabilitas konfigurasi visual, baru bungkus dengan FlowModel — ini adalah pendekatan bertahap yang direkomendasikan. Konten besar dikelola dengan FlowModel, detail internal diimplementasikan dengan Component React, keduanya digunakan bersama.

## Tautan Terkait

- [Pengembangan Component](./component/index.md) — Cara penulisan Component React dan penggunaan useFlowContext
- [Ikhtisar FlowEngine](./flow-engine/index.md) — Penggunaan dasar FlowModel dan registerFlow
- [Dokumentasi Lengkap FlowEngine](../../flow-engine/index.md) — Referensi lengkap FlowModel, Flow, Context
