# 编写第一个插件

我们通过编写一个 hello 插件来理解如何进行扩展。该插件会实现一些简单的功能：

* 在每一个访问请求记录一条 hello 日志
* 在对 `/hello` 路由的访问返回一个 hello 字符串

## 开发准备

首先，我们需要创建一个 NocoBase 应用：

```bash
yarn create nocobase-app myapp
cd myapp
yarn install
```

这样我们准备好了基本的开发和运行环境，并且当我们继续执行 `yarn dev` 时，即可启动开发服务器，并随时根据代码的变动观察到效果。

## 创建一个插件

我们在已创建好的 `packages/plugins` 目录中创建 hello 插件的目录，并将该目录初始化为一个普通的 npm 包：

```bash
mkdir -p packages/plugins/hello/src
cd packages/plugins/hello
yarn init -y
yarn add @nocobase/server
```

接下来创建插件的主文件：

```bash
vim src/index.ts
```

并开始编辑内容：

```ts
import { Plugin } from '@nocobase/server';

class Hello extends Plugin {
  getName() {
    return 'hello';
  }

  // 应用启动前会加载插件
  async load() {
    // 在每一个请求后记录一条 hello 日志
    this.app.resourcer.use(async (ctx, next) => {
      await next();
      console.log('hello');
    });

    // 提供一个 /hello:get 路由，返回 hello 字符串
    this.app.resource({
      name: 'hello',
      actions: {
        get(ctx) {
          ctx.body = 'hello';
        },
      },
    });

    // 向权限控制表声明允许对应的路由被访问
    this.app.acl.allow('hello', 'get', true);
  }
}

// 导出插件
export default Hello;
```

注：NocoBase 提供了用于编写插件的模板类 `Plugin`，所有插件均通过继承该抽象类进行扩展实现。

回退到项目根目录，对 hello 插件进行编译：

```bash
yarn build plugins/hello
```

然后修改 `packages/plugins/hello/package.json` 文件中的 `main` 字段为 `"lib/index.js"`。

以及对应的 `packages/app/server/package.json` 文件，加入 hello 插件的依赖：

```json
{
  "dependencies": {
    "hello": "1.0.0"
  }
}
```

项目根目录下执行 `yarn` 命令安装插件的包。

再修改 `packages/app/server/src/config/plugins.ts` 文件，将 hello 插件添加到插件列表中：

```ts
export default [
  'hello',
];
```

执行 `yarn dev` 启动开发服务器，访问 `http://localhost:13000/api/hello:get`，即可看到数据中 hello 的返回，并且命令行的日志中也输出了一行 `hello`。

## 规划目录结构

## 针对应用扩展

## 调试插件
