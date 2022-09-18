# 编写第一个插件

在此之前，需要先安装好 NocoBase：

- create-nocobase-app 安装
- Git 源码安装

相关安装、启动命令如下：

```bash
cd my-nocobase-app
yarn install
yarn nocobase install
yarn dev
```

插件开发和调试，需要在开发环境并通过 `yarn dev` 启动。做好准备之后，我们就可以开始 NocoBase 的插件开发之旅了。

## 创建插件

首先，你可以通过 CLI 快速的创建一个初始化的插件，命令如下：

```bash
yarn pm create hello
```

新建的插件，会放置在 `packages/plugins/hello` 目录下。

## 插件目录结构

```ts
|- /hello
  |- /src
    |- /client
    |- /server
  |- client.d.ts
  |- client.js
  |- package.json
  |- server.d.ts
  |- server.js
```

## 编写插件

插件的主体文件在 `packages/plugins/hello/src/server/plugin.ts`，修改为：

```ts
import { InstallOptions, Plugin } from '@nocobase/server';

export class Hello extends Plugin {
  initialize() {
    // TODO
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    // TODO
    // Visit: http://localhost:13000/api/hello:get
    this.app.resource({
      name: 'hello',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello plugin1!`;
          next();
        },
      },
    });
    this.app.acl.allow('hello', 'getInfo');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default Hello;
```

## 注册插件

```bash
yarn pm add hello
```

## 激活插件

```bash
yarn pm enable hello
```

## 体验插件功能

访问地址 http://localhost:13000/api/hello:get
