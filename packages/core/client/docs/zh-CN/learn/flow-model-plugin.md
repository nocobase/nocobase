# 编写第一个 FlowModel 插件

在开始之前，建议先参考「[编写第一个插件](https://docs-cn.nocobase.com/development/your-fisrt-plugin)」快速创建一个基础插件。完成后，我们将在此基础上扩展区块、操作或字段。

## 选择扩展内容

NocoBase 提供了灵活的扩展机制，支持对 **区块（Blocks）**、**操作（Actions）** 和 **字段（Fields）** 进行扩展。只需继承相应的基类，即可实现自定义功能。

## 扩展一个区块

### 创建 HelloBlockModel

在插件的 `client` 目录下创建一个 `HelloBlockModel.tsx` 文件，完整路径如下：

```
packages/plugins/@my-project/plugin-hello/src/client/models/HelloBlockModel.tsx
```

文件内容如下：

```tsx | pure
import { BlockModel } from '@nocobase/client';
import React from 'react';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>这是由 HelloBlockModel 渲染的简单区块。</p>
      </div>
    );
  }
}
```

### 注册 HelloBlockModel

在插件类的 `load` 方法中添加 `this.flowEngine.registerModels({ HelloBlockModel })`，文件路径如下：

```
packages/plugins/@my-project/plugin-hello/src/client/index.tsx
```

文件内容如下：

```ts
import { Plugin } from '@nocobase/client';
import { HelloBlockModel } from './models/HelloBlockModel';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // 可在此处添加插件初始化逻辑
  }

  async beforeLoad() {}

  async load() {
    this.flowEngine.registerModels({ HelloBlockModel });
  }
}

export default PluginHelloClient;
```

## 激活插件

激活插件后，你就可以在页面中看到扩展的区块。

![区块示例](https://static-docs.nocobase.com/20250915225135.png)

将区块添加到页面后，效果如下：

![区块效果](https://static-docs.nocobase.com/20250915225203.png)

## 总结

至此，一个简单的自定义区块已经完成。字段和操作的扩展也同样简单，更多内容请参考「[扩展指南](/learn)」。