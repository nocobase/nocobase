:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memulai dengan FlowModel

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

| Nama Kelas Dasar        | Deskripsi                                 |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Kelas dasar untuk semua blok              |
| `CollectionBlockModel`  | Blok koleksi, mewarisi dari BlockModel    |
| `ActionModel`           | Kelas dasar untuk semua aksi              |

## Mendaftarkan FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Merender FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```