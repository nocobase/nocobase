---
title: "注册 FlowModel"
description: "注册 FlowModel：FlowEngine.registerFlowModel 将 FlowModel 注册到引擎，供插件与页面使用，registerFlowModel 用法。"
keywords: "注册 FlowModel,registerFlowModel,FlowEngine,插件注册,FlowModel 注册,NocoBase"
---

# 注册 FlowModel

## 从自定义 FlowModel 开始

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

## 可用的 FlowModel 基类

| 基类名称               | 说明                          |
| ---------------------- | ----------------------------- |
| `BlockModel`           | 所有区块的基类                |
| `CollectionBlockModel` | 数据表区块，继承自 BlockModel |
| `ActionModel`          | 所有操作的基类                |

## 注册 FlowModel

```ts
export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // 动态导入，首次真正用到这个 model 时才会加载对应模块
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```
