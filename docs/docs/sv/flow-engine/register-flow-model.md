:::tip AI-översättningsmeddelande
Denna dokumentation har översatts automatiskt av AI.
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
    this.engine.registerModels({ HelloModel });
  }
}
```