---
title: "Mendaftarkan FlowModel"
description: "Mendaftarkan FlowModel: FlowEngine.registerFlowModel mendaftarkan FlowModel ke engine, untuk digunakan oleh plugin dan halaman, penggunaan registerFlowModel."
keywords: "mendaftarkan FlowModel,registerFlowModel,FlowEngine,registrasi plugin,registrasi FlowModel,NocoBase"
---

# Mendaftarkan FlowModel

## Mulai dari FlowModel Kustom

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

```tsx file="./_demos/register-flow-model.tsx" preview
```

## Class Dasar FlowModel yang Tersedia

| Nama Class Dasar               | Penjelasan                          |
| ---------------------- | ----------------------------- |
| `BlockModel`           | Class dasar semua Block                |
| `CollectionBlockModel` | Block tabel data, inherits dari BlockModel |
| `ActionModel`          | Class dasar semua Action                |

## Mendaftarkan FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Dynamic import, modul yang sesuai akan dimuat saat model ini benar-benar digunakan pertama kali
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```
