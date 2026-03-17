:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Registrera FlowModel

## Börja med en anpassad FlowModel

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

## Tillgängliga FlowModel-basklasser

| Basklassnamn            | Beskrivning                       |
| ----------------------- | --------------------------------- |
| `BlockModel`            | Basklass för alla block           |
| `CollectionBlockModel`  | Samlingsblock, ärver från BlockModel |
| `ActionModel`           | Basklass för alla åtgärder        |

## Registrera FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Dynamisk import: modellmodulen laddas först när modellen faktiskt behövs för första gången
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```