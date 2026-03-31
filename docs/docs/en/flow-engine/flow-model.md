# Starting with FlowModel

## Custom FlowModel

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

## Available FlowModel Base Classes

| Base Class Name         | Description                               |
| ----------------------- | ----------------------------------------- |
| `BlockModel`            | Base class for all blocks                 |
| `CollectionBlockModel`  | Collection block, inherits from BlockModel |
| `ActionModel`           | Base class for all actions                |

## Registering FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```

## Rendering FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```