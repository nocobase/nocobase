:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Kom igång med FlowModel

## Anpassad FlowModel

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

| Basklassens namn        | Beskrivning                               |
| :---------------------- | :---------------------------------------- |
| `BlockModel`            | Basklass för alla block                   |
| `CollectionBlockModel`  | Samlingsblock, ärver från BlockModel      |
| `ActionModel`           | Basklass för alla åtgärder                |

## Registrera FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Rendera FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```