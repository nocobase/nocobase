---
title: "Perbandingan FlowModel dengan Komponen React"
description: "Perbandingan FlowModel dengan React.Component: konfigurasi vs koding, kemampuan orkestrasi, pemilihan skenario penggunaan, panduan pemilihan FlowEngine."
keywords: "FlowModel,Komponen React,Perbandingan,Dapat diorkestrasi,Konfigurasi,Pemilihan FlowEngine,NocoBase"
---

# FlowModel vs React.Component

## Perbandingan Tanggung Jawab Dasar

| Fitur/Kemampuan         | `React.Component`                      | `FlowModel`                                                |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Kemampuan render        | Ya, metode `render()` menghasilkan UI  | Ya, metode `render()` menghasilkan UI                      |
| Manajemen state         | `state` dan `setState` bawaan          | Menggunakan `props`, tetapi manajemen state lebih bergantung pada struktur model tree |
| Lifecycle               | Ya, seperti `componentDidMount`        | Ya, seperti `onInit`, `onMount`, `onUnmount`               |
| Tujuan                  | Membangun komponen UI                  | Membangun "model tree" yang data-driven, mengalir, dan terstruktur |
| Struktur data           | Component tree                         | Model tree (mendukung parent-child model, multi-instance Fork) |
| Komponen anak           | Menggunakan nesting JSX                | Mengatur sub-model secara eksplisit dengan `setSubModel`/`addSubModel` |
| Perilaku dinamis        | Event binding, update state mendorong UI | Mendaftarkan/men-dispatch Flow, menangani auto flow      |
| Persistensi             | Tidak ada mekanisme bawaan             | Mendukung persistensi (seperti `model.save()`)             |
| Mendukung Fork (render berkali-kali) | Tidak (perlu reuse manual)   | Ya (`createFork` multi-instance)                           |
| Kontrol engine          | Tidak ada                              | Ya, dikelola, didaftarkan, dan dimuat oleh `FlowEngine`    |

## Perbandingan Lifecycle

| Lifecycle Hook   | `React.Component`                  | `FlowModel`                                  |
| ---------------- | ---------------------------------- | -------------------------------------------- |
| Inisialisasi     | `constructor`, `componentDidMount` | `onInit`, `onMount`                          |
| Unmount          | `componentWillUnmount`             | `onUnmount`                                  |
| Respons input    | `componentDidUpdate`               | `onBeforeAutoFlows`, `onAfterAutoFlows`      |
| Penanganan error | `componentDidCatch`                | `onAutoFlowsError`                           |

## Perbandingan Struktur Bangunan

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## Component Tree vs Model Tree

* **React Component Tree**: UI render tree yang dibentuk oleh JSX nesting saat runtime.
* **FlowModel Model Tree**: Pohon struktur logika yang dikelola oleh FlowEngine, dapat di-persisten, didaftarkan secara dinamis dan mengontrol sub-model. Cocok untuk membangun page block, action flow, model data, dan sebagainya.

## Fitur Khusus (Khusus FlowModel)

| Fitur                                  | Deskripsi                                            |
| -------------------------------------- | ---------------------------------------------------- |
| `registerFlow`                         | Mendaftarkan Flow                                    |
| `applyFlow` / `dispatchEvent`          | Mengeksekusi/memicu Flow                             |
| `setSubModel` / `addSubModel`          | Mengontrol secara eksplisit pembuatan dan binding sub-model |
| `createFork`                           | Mendukung satu model logic yang di-reuse render berkali-kali (seperti setiap baris tabel) |
| `openFlowSettings`                     | Pengaturan Flow Step                                 |
| `save` / `saveStepParams()`            | Model dapat di-persisten, terhubung dengan backend   |

## Ringkasan

| Item            | React.Component             | FlowModel                                  |
| --------------- | --------------------------- | ------------------------------------------ |
| Skenario cocok  | Organisasi komponen layer UI | Manajemen Flow dan Block yang data-driven |
| Ide inti        | UI deklaratif               | Flow terstruktur yang model-driven         |
| Cara manajemen  | React mengontrol lifecycle  | FlowModel mengontrol lifecycle dan struktur model |
| Keunggulan      | Ekosistem dan toolchain yang kaya | Sangat terstruktur, Flow dapat di-persisten, sub-model dapat dikontrol |

> FlowModel dapat digunakan secara saling melengkapi dengan React: menggunakan render React di dalam FlowModel, sementara FlowEngine mengelola lifecycle dan strukturnya.
