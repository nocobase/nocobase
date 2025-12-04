:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowModel'i Kaydetme

## Özel bir FlowModel ile Başlayın

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

## Kullanılabilir FlowModel Temel Sınıfları

| Temel Sınıf Adı         | Açıklama                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Tüm bloklar için temel sınıf                 |
| `CollectionBlockModel`  | Koleksiyon bloğu, BlockModel'den miras alır |
| `ActionModel`           | Tüm eylemler için temel sınıf                |

## FlowModel'i Kaydetme

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```