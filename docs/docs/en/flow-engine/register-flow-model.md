# Register FlowModel

## Start with a custom FlowModel

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

## Available FlowModel base classes

| Base Class Name        | Description                                |
| ---------------------- | ------------------------------------------ |
| `BlockModel`           | Base class for all blocks                  |
| `CollectionBlockModel` | Collection block, inherits from BlockModel |
| `ActionModel`          | Base class for all actions                 |

## Register FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Dynamic import: the model module loads only when this model is first needed
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```
