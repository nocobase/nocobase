---
title: "Konsep Inti FlowModel"
description: "FlowModel adalah inti dari FlowEngine, mengelola properti komponen, state, Flow, dan render. Memahami FlowModel adalah langkah pertama untuk menguasai FlowEngine."
keywords: "FlowModel,FlowEngine inti,Model komponen,Manajemen properti,Pembawa Flow,Dapat diorkestrasi,NocoBase"
---

# Memulai dari FlowModel

## FlowModel Kustom

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}
```

## Kelas Dasar FlowModel yang Tersedia

| Nama Kelas Dasar        | Deskripsi                                |
| ----------------------- | ---------------------------------------- |
| `BlockModel`            | Kelas dasar untuk semua Block            |
| `CollectionBlockModel`  | Block tabel data, mewarisi BlockModel    |
| `ActionModel`           | Kelas dasar untuk semua Action           |

## Mendaftarkan FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Dynamic import, modul akan dimuat hanya saat model ini benar-benar digunakan untuk pertama kalinya
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```

## Merender FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```
