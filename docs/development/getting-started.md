# 快速开始 - 开发第一个 NocoBase 插件

本文档将指导您创建第一个 NocoBase 插件。

## 1. 创建插件

NocoBase 提供了 CLI 工具来快速创建插件模板：

```bash
# 切换到项目根目录
cd nocobase

# 创建插件
yarn pm create hello
```

这将在 `packages/plugins/@local/` 目录下创建一个名为 `plugin-hello` 的插件。

## 2. 插件目录结构

创建的插件将具有以下目录结构：

```
plugin-hello/
├── package.json
├── src/
│   ├── client/
│   │   └── index.tsx
│   └── server/
│       └── index.ts
└── README.md
```

## 3. 服务端代码

服务端入口文件 `src/server/index.ts` 包含插件的基本结构：

```typescript
import { InstallOptions, Plugin } from '@nocobase/server';

export class HelloPlugin extends Plugin {
  beforeLoad() {
    // 在插件加载前执行的逻辑
  }

  async load() {
    // 插件加载时执行的主要逻辑
    this.app.resource({
      name: 'testHello',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello hello!`;
          next();
        },
      },
    });
    this.app.acl.allow('testHello', 'getInfo');
  }

  async disable() {
    // 插件禁用时执行的清理逻辑
  }

  async install(options: InstallOptions) {
    // 插件安装时执行的初始化逻辑
  }
}

export default HelloPlugin;
```

## 4. 客户端代码

客户端入口文件 `src/client/index.tsx` 包含前端组件：

```typescript
import { Plugin } from '@nocobase/client';
import { Card } from 'antd';
import React from 'react';

class HelloPlugin extends Plugin {
  async load() {
    // 插件加载逻辑
    this.app.pluginSettingsManager.add('hello', {
      title: 'Hello',
      icon: 'ApiOutlined',
      Component: () => (
        <Card bordered={false}>
          <div>Hello plugin setting page</div>
        </Card>
      ),
      sort: 100,
    });
  }
}

export default HelloPlugin;
```

## 5. 激活插件

创建插件后，需要激活它：

```bash
# 安装插件
yarn nocobase install hello

# 或者使用完整包名
yarn nocobase install @local/plugin-hello
```

## 6. 调试插件

启动开发服务器以调试插件：

```bash
yarn dev
```

访问 `http://localhost:13000/api/testHello:getInfo` 可以看到插件提供的 API 接口。

## 7. 构建插件

在生产环境中使用插件前，需要构建它：

```bash
yarn build
```

## 8. 发布插件

构建完成后，可以将插件发布到其他 NocoBase 应用：

```bash
yarn pm publish hello
```

## 下一步

- 查看 [目录结构](./directory-structure.md) 了解插件的完整目录组织
- 学习 [客户端开发](./client-development.md) 创建丰富的 UI 组件
- 掌握 [服务端开发](./server-development.md) 实现复杂的业务逻辑
