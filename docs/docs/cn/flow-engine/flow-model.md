---
title: "FlowModel 核心概念"
description: "FlowModel 是 FlowEngine 核心，管理组件属性、状态、Flow、渲染，理解 FlowModel 是掌握 FlowEngine 的第一步。"
keywords: "FlowModel,FlowEngine 核心,组件模型,属性管理,Flow 承载,可编排,NocoBase"
---

# 从 FlowModel 开始

## 自定义 FlowModel

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
    this.engine.registerModelLoaders({
      HelloModel: {
        // 动态导入，首次真正用到这个 model 时才会加载对应模块
        loader: () => import('./HelloModel'),
      },
    });
  }
}
```

## 渲染 FlowModel

```tsx pure
<FlowModelRenderer model={model} />
```
