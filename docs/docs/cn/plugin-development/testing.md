---
title: '插件测试'
description: '验证插件页面、服务、迁移、命令及应用集成。'
---

# 插件测试

插件在 `devDependencies` 中声明 `@nocobase/app-testing`，从它的 `client`、`server`、`cli` 入口获取工具，不直接导入 `@nocobase/db-testing` 或 `@nocobase/app-cli/testing`。[应用测试指南](../app/testing)介绍 fixture 生命周期、严格翻译和 API 应答；这里介绍插件特有的配置。

## 目录与环境

插件生成器通过 Vitest projects 按目录选择环境：

| 目录                                | 内容                                 | 环境         |
| ----------------------------------- | ------------------------------------ | ------------ |
| `tests/client/`                     | 页面、组件和客户端服务               | jsdom        |
| `tests/server/`                     | 服务、生产路由和权限                 | Node         |
| `tests/database/`                   | 迁移和种子                           | Node         |
| `tests/cli/`                        | 命令                                 | Node         |
| `tests/project/`                    | 包导出和构建产物                     | Node         |
| `tests/fixtures/`、`tests/helpers/` | 测试应用和共享辅助代码，不放测试文件 | 由调用方决定 |

文件名使用 `*.test.ts` 或 `*.test.tsx`，已有目录配置时不需要环境注释。没有客户端代码的插件仅生成 Node project，第一次添加客户端测试时再补 React project 和 jsdom 测试依赖。旧插件在迁移配置前沿用既有布局。

## 页面与客户端服务

以下例子假设插件从 `client/index.ts` 导出注册工厂，有请求 `GET orders` 的 `OrdersPage`，并在插件声明中提供语言资源。请按实际功能替换名称和响应体。

```tsx
// tests/client/orders.test.tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import orders from '../../client/index.js';
import OrdersPage from '../../client/pages/orders.js';
import packageMetadata from '../../package.json' with { type: 'json' };

it('loads orders with the plugin services and translations', async () => {
  await renderWithApp(<OrdersPage />, {
    plugins: [orders()],
    namespace: packageMetadata.name,
    route: '/orders',
    fetch: answerApi(({ method, path }) =>
      method === 'GET' && path === 'orders'
        ? { data: [{ id: '1', name: 'Order 1' }] }
        : new Response(null, { status: 404 }),
    ),
  });
  expect(await screen.findByText('Order 1')).toBeInTheDocument();
});
```

传入插件后，其服务提供者会运行，语言资源也会加载；不传就不会注册。插件自己的页面使用 `namespace: packageMetadata.name`；需要在插件外使用并自行指定翻译命名空间的公共组件，测试时省略这个选项。

用 `answerApi()` 回答请求，通过 `services` 注册外部服务替身，通过渲染结果的 `toasts()` 检查通知。不 mock 应用 hooks，也不要同时注册服务替身及其所属插件。工具内部已有内存路由，在其中渲染子 `Routes`。覆盖子页面直接访问、重定向、查询参数保留和无权限操作；宿主路由守卫还需要目标应用测试。

## 服务、路由和真实权限

纯业务逻辑直接传入依赖测试。路由测试调用生产贡献的 `createRouter()`，提供所需服务，向生成的路由发送请求。需要数据库时，从 `@nocobase/app-testing/server` 使用 `createDatabaseTest()`，不要为了测试额外创建一套注册 API。

真实登录、最终挂载路径和权限执行，通过 `createAppTest()` 加测试应用的 `createStandaloneServer` 验证，或将用例加入目标应用的测试集。测试应用的 runtime 必须注册当前插件，以及它需要的认证、授权等插件。插件的 `server/plugin.ts` 是声明，不是应用服务端工厂。

通过 `@nocobase/app-plugin-authentication/testing` 的 `signIn()` 登录。覆盖匿名 `401`、已登录但无权限 `403`、有权限的预期响应。明确公开的回调则验证签名和防重放边界。隐藏按钮不能证明服务端操作受到权限保护。应用测试默认文件内共享数据，需要独立数据时设置 `scope: 'test'`。

## 迁移与种子

插件迁移位于 `database/migrations`，没有连接名这一层。在 `sources` 中列出当前包及所需依赖包。以下例子假设名为 `202610080001_orders_create_orders` 的迁移创建了必填字符串字段 `orders.name`：

```ts
// tests/database/orders.test.ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202610080001_orders_create_orders', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('orders').toHaveField('name', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('orders').not.toExist();
  },
});
```

fixture 在所选数据库上执行迁移、回滚和重新执行，并检查结构与元数据。插件测试不自行选择驱动。数据库服务或种子测试使用 `createDatabaseTest({ migrations, seeds })`，验证实际持久化行为，包括种子重复执行。

## 命令与交付

使用 `@nocobase/app-testing/cli` 的 `bindAppCommand()` 和 `runAppCommand()` 验证命令结果与错误。启动真实应用的命令使用 `createTestAppConfig()` 和 `bindTestAppCommand()`，传入测试应用根目录，并在 `finally` 中销毁配置。参见[命令示例](../app/testing#测试命令)。

运行插件的 `lint`、`typecheck`、`test`、`build` 以及受影响应用消费者的检查。在源码仓库中使用 `pnpm --filter <plugin-package>` 限定范围。`pnpm db-tests:check` 检查数据库可移植性，`pnpm test:db <dialect> --filter <plugin-package>` 在其他数据库上执行测试。这些根脚本属于源码仓库，不属于生成的独立应用。

修改打包时，检查发布导出、类型声明和迁移资源。测试从 `package.json` 读取包名及版本。脚手架生成、构建或注册成功，都不能单独证明安装后的插件行为正确；还应在目标应用中验证受影响流程。
