# 编写第一个插件

本文将带你从零开始创建一个可在页面中使用的区块插件，帮助你了解 NocoBase 插件的基本结构和开发流程。

## 前置条件

在开始之前，请确保你已经成功安装 NocoBase。如果尚未安装，可以参考以下安装指南：

- [使用 create-nocobase-app 安装](/get-started/installation/create-nocobase-app)
- [从 Git 源码安装](/get-started/installation/git)

安装完成后，就可以正式开启你的插件开发之旅了。

## 第 1 步：通过 CLI 创建插件骨架

在仓库根目录执行以下命令，快速生成一个空的插件：

```bash
yarn pm create @my-project/plugin-hello
```

命令运行成功后，会在 `packages/plugins/@my-project/plugin-hello` 目录下生成基础文件，默认结构如下：

```bash
├─ /packages/plugins/@my-project/plugin-hello
  ├─ package.json
  ├─ README.md
  ├─ client.d.ts
  ├─ client.js
  ├─ server.d.ts
  ├─ server.js
  └─ src
     ├─ index.ts                 # 默认导出服务端插件
     ├─ client                   # 客户端代码存放位置
     │  ├─ index.tsx             # 默认导出的客户端插件类
     │  ├─ plugin.tsx            # 插件入口（继承 @nocobase/client Plugin）
     │  ├─ models                # 可选：前端模型（如流程节点）
     │  │  └─ index.ts
     │  └─ utils
     │     ├─ index.ts
     │     └─ useT.ts
     ├─ server                   # 服务端代码存放位置
     │  ├─ index.ts              # 默认导出的服务端插件类
     │  ├─ plugin.ts             # 插件入口（继承 @nocobase/server Plugin）
     │  ├─ collections           # 可选：服务端 collections
     │  ├─ migrations            # 可选：数据迁移
     │  └─ utils
     │     └─ index.ts
     ├─ utils
     │  ├─ index.ts
     │  └─ tExpr.ts
     └─ locale                   # 可选：多语言
        ├─ en-US.json
        └─ zh-CN.json
```

创建完成后，可在浏览器中访问插件管理器页面（默认地址：http://localhost:13000/admin/settings/plugin-manager ），以确认插件是否已出现在列表中。

## 第 2 步：实现一个简单的客户端区块

接下来我们为插件添加一个自定义区块模型，展示一段欢迎文本。

1. **新增区块模型文件** `client/models/HelloBlockModel.tsx`：

```tsx pure
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}

HelloBlockModel.define({
  label: tExpr('Hello block'),
});
```

2. **注册区块模型**。编辑 `client/models/index.ts`，将新模型导出，供前端运行时加载：

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { HelloBlockModel } from './HelloBlockModel';

export default {
  HelloBlockModel,
} as Record<string, ModelConstructor>;
```

保存代码后，如果你正运行开发脚本，应能在终端输出中看到热更新的日志。

## 第 3 步：激活并体验插件

你可以通过命令行或界面开启插件：

- **命令行**

  ```bash
  yarn pm enable @my-project/plugin-hello
  ```

- **管理界面**：访问插件管理器，找到 `@my-project/plugin-hello`，点击“激活”。

激活后，新建一个「Modern page (v2)」页面，添加区块时即可看到「Hello block」，将其插入页面即可看到你刚才编写的欢迎内容。

![20250928174529](https://static-docs.nocobase.com/20250928174529.png)

## 第 4 步：构建与打包

当你准备将插件分发到其他环境时，需要先构建再打包：

```bash
yarn build @my-project/plugin-hello --tar
# 或者分两步执行
yarn build @my-project/plugin-hello
yarn nocobase tar @my-project/plugin-hello
```

> 提示：如果插件是在源码仓库中创建的，首次构建会触发整仓库的类型检查，耗时可能较长。建议确保依赖已安装并保持仓库处于可构建状态。

构建完成后，打包文件默认位于 `storage/tar/@my-project/plugin-hello.tar.gz`。

## 第 5 步：上传到其他 NocoBase 应用

上传并解压至目标应用的 `./storage/plugins` 目录，详情查看 [安装与升级插件](../get-started/install-upgrade-plugins.mdx)。