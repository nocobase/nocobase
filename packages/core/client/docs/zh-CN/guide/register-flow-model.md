# 注册 FlowModel

## 从自定义 FlowModel 开始

```tsx | pure
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

## 可用的 FlowModel 基类

| 基类名称                    | 说明                       |
| ----------------------- | ------------------------ |
| `BlockModel`            | 所有区块的基类                  |
| `CollectionBlockModel`  | 数据表区块，继承自 BlockModel     |
| `ActionModel`           | 所有操作的基类                  |

## 注册 FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModels({ HelloModel });
  }
}
```
