---
title: '测试'
description: '使用统一测试工具验证应用页面、接口、迁移和命令。'
---

# 测试

应用和插件在 `devDependencies` 中声明 `@nocobase/app-testing`，通过它获得隔离数据库上的应用、页面的客户端上下文和命令测试工具。纯函数和可以直接传入依赖的服务仍使用普通 Vitest 测试。

## 选择测试层

| 要验证的行为                   | 工具                                                               | 环境   |
| ------------------------------ | ------------------------------------------------------------------ | ------ |
| 页面交互、API 请求、翻译和通知 | `@nocobase/app-testing/client` 的 `renderWithApp()`、`answerApi()` | jsdom  |
| 真实应用接口、登录和权限       | `@nocobase/app-testing/server` 的 `createAppTest()`                | Node   |
| 需要数据库的服务或独立路由     | `@nocobase/app-testing/server` 的 `createDatabaseTest()`           | Node   |
| 迁移的结构和元数据             | `@nocobase/app-testing/server` 的 `describeMigration()`            | Node   |
| CLI 参数、结果、错误和应用访问 | `@nocobase/app-testing/cli`                                        | Node   |
| 浏览器导航、布局和完整操作流程 | 对运行中的应用执行 Playwright                                      | 浏览器 |

需要真实数据库或登录，不等于需要浏览器测试。接口边界在 Node 中验证，页面行为在 jsdom 中验证；涉及浏览器能力或跨越两者的完整流程，再增加浏览器测试。

## 测试放在哪里

当前应用模板将页面和组件测试放在 `tests/components/`，逻辑和集成测试放在 `tests/logic/`，浏览器测试放在 `tests/playwright/`。文件名使用 `*.test.ts` 或 `*.test.tsx`，不要放在业务源码旁边。模板的 Vitest 默认使用 jsdom，因此服务端、数据库和 CLI 测试在文件顶部声明 `// @vitest-environment node`。以应用实际配置为准；新生成的插件使用[按目录选择环境的配置](../plugin-development/testing)。

以下示例假设你已经实现订单页面、需要登录并返回 `{ data: [{ id, name }] }` 的 `GET /api/orders`、创建 `orders.name` 的迁移，以及支持 `--dry-run` 的导出命令。请按实际功能替换名称和响应结构。模板中可以直接运行的页面样板是 `tests/components/page-harness.test.tsx`。

## 测试真实应用

```ts
// tests/logic/orders.test.ts
// @vitest-environment node
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: { auth: { secret: 'test-only-auth-secret-at-least-32-characters' } },
});

test('requires a session to list orders', async ({ testApp, request }) => {
  expect((await request('/orders')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await admin.fetch('/orders')).status).toBe(200);
});
```

fixture 启动应用自身的 runtime，包含已注册插件、迁移和种子。`request('/orders')` 指向应用公开基础路径之下的 API。使用应用实际初始化或测试创建的账号登录；只有安装了默认管理员，默认凭据才适用。受保护接口还需要增加一个没有相应授权的登录账号，断言返回 `403`。上面的例子只覆盖匿名和管理员两种情况。

`createAppTest()` 默认每个文件启动一个应用，文件内的测试共享数据。需要每个用例独立时设置 `scope: 'test'`，或明确清理各用例创建的记录和授权。fixture 负责删除数据库和临时存储；直接调用 `createTestApp()` 时，在 `finally` 中执行 `close()`。

通过 `connections` 列出测试会写入的所有连接，例如 `['main', 'analytics']`。未列出的连接仍使用应用自身配置。其他测试配置通过 `config` 传入；应用配置加载器需要像模板一样读取 fixture 提供的 `configPath`。必要时在测试配置中关闭无关的外部集成。

## 测试页面

```tsx
// tests/components/orders.test.tsx
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import packageMetadata from '../../package.json' with { type: 'json' };
import locales from '../../client/locales/index.js';
import OrdersPage from '../../client/pages/orders.js';

it('shows the orders returned by the API', async () => {
  const api = vi.fn(({ method, path }: ApiCall) => {
    if (method === 'GET' && path === 'orders') {
      return { data: [{ id: '1', name: 'Order 1' }] };
    }
    return new Response(null, { status: 404 });
  });
  await renderWithApp(<OrdersPage />, {
    route: '/orders',
    namespace: packageMetadata.name,
    namespaces: { [packageMetadata.name]: locales },
    fetch: answerApi(api),
  });

  expect(await screen.findByText('Order 1')).toBeInTheDocument();
  expect(api).toHaveBeenCalledWith({ method: 'GET', path: 'orders' });
});
```

`renderWithApp()` 启动客户端应用，保留真实的 `useApiClient()`、`useService()`、`useTranslation()` 和 `useToaster()`。它不会自动加载应用的 `client/runtime.ts`。通过 `plugins` 传入所需客户端插件，通过 `namespace` 和 `namespaces` 提供应用翻译，通过 `services` 注册应用服务或外部依赖替身。同一个服务 token 不要既注册替身，又注册它所属的插件。

工具内部已有内存路由。用 `route` 指定起始 URL，在渲染内容中声明 `Routes` 和子 `Route`，不要再套一层 Router。应用声明的路由守卫不会自动执行，需要另用应用路由测试或浏览器流程验证。

如果安装后的应用在工具内部仍报 `useLocation()` 找不到 Router，检查 React Vitest preset 的 inline 规则。旧 preset 可以在 `test.server.deps.inline` 中补上 `/@nocobase\/(?:app-client\/|app-plugin-[^/]+\/(?:dist\/)?client\/|app-testing\/(?:dist\/)?src\/client\/)/u`，让发布包中的工具、页面和插件客户端共用应用与路由上下文。服务端与数据库 fixture 保持 external；再加一层 Router 不能解决上下文被分开的原因。

翻译检查默认严格：缺失 key 会使渲染失败，即使组件传了 `defaultValue`。应修复 key 或语言资源。传入语言加载映射并设置 `locale: 'zh-CN'` 可以验证中文。不依赖应用服务的独立翻译组件，仍可使用 `@nocobase/i18n/testing` 的 `TestI18nProvider`。

`answerApi()` 将 `method`、API 根路径以下的 `path`、可选的 `query` 和解析后的 `json` 交给 handler。返回普通响应体代表 200，其他状态返回 `Response`。明确处理意外请求：不返回内容会产生成功的 `null` 响应，抛异常则转换为 HTTP 500。要断言页面结果和预期调用，避免错误被忽略。

保留渲染结果，在操作完成后通过 `expect(view.toasts()).toEqual([expect.objectContaining({ type: 'success' })])` 检查通知。工具也会渲染通知文本，并在测试结束时清理。覆盖加载、空数据、错误、成功，以及有权限和无权限两种情况；断言操作不存在前，先等权限检查完成。

`server` 可以替代 `fetch`，接收提供 `fetch(Request)` 和 `publicBasePath` 的对象，例如 `createTestApp()` 的返回值。传入 `signIn()` 会话的 `cookie`，请求便使用该用户身份。client 入口可在 jsdom 下使用，但 Node 数据库和服务端 fixture 仍需要正确的执行环境。完整浏览器与服务端流程交给浏览器测试。

## 测试数据库和迁移

测试不自行导入数据库驱动或创建内存数据库。未设置 `NOCOBASE_TEST_DB_DIALECT` 时 fixture 使用 SQLite，设置后使用对应数据库。选择其他数据库时，安装其驱动包，并按该包的测试说明配置测试服务器。使用 `expectCollection()` 按逻辑集合名、字段名断言结构，不写特定数据库的 SQL。

不需要整个应用的数据库服务测试使用 `createDatabaseTest({ migrations, seeds })`。默认每个用例重置结构并重新执行迁移；`isolation: 'none'` 则在文件内共享数据库。

```ts
// tests/logic/orders-migration.test.ts
// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202610080001_create_orders', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/main/migrations', import.meta.url),
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

`describeMigration()` 先执行之前的迁移，再执行指定迁移、回滚、重新执行，并检查结构与元数据一致，回滚后恢复原有结构。需要其他包的表时，加入其迁移来源。数据迁移使用 `before` 准备旧结构中的记录；只有明确不可逆的迁移才设置 `reversible: false`。种子还应覆盖已有记录和重复执行的行为。

## 测试命令

不启动应用的命令，从 `@nocobase/app-testing/cli` 导入 `bindAppCommand()` 和 `runAppCommand()`，断言 `result`、`json()`、`error` 和 `exitCode`。需要真实应用的命令使用隔离数据库配置：

```ts
// tests/logic/export-orders.test.ts
// @vitest-environment node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';
import OrdersExport from '../../cli/commands/orders/export.ts';
import runtime from '../../server/runtime.ts';
import { createApp } from '../../server/app.ts';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

it('previews the export', async () => {
  const config = await createTestAppConfig({
    config: {
      auth: { secret: 'test-only-auth-secret-at-least-32-characters' },
    },
  });
  try {
    const Bound = bindTestAppCommand(OrdersExport, {
      rootDir,
      id: 'app:orders:export',
      config,
      createApp,
      loadRuntime: () =>
        resolveStandaloneAppRuntime(runtime, {
          rootDir,
          configPath: config.path,
          env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
          consoleLogStream: 'stderr',
        }),
    });
    const run = await runAppCommand(Bound, ['--dry-run', '--json']);
    expect(run.json()).toMatchObject({ ok: true, status: 'success-noop' });
  } finally {
    await config.dispose();
  }
});
```

显式导入 `runtime` 和 `createApp`，让 Vitest 处理应用的 TypeScript 模块及其 `.js` 导入路径。自定义 `loadRuntime` 时需要自行传入 `config.path`；示例也把应用存储放入 fixture 临时目录。使用编译后的 JavaScript 或已启用 TypeScript loader 时，可以沿用默认加载器。`createTestAppConfig()` 隔离数据库，不会自动隔离命令写出的其他文件；导出文件等也应写入临时目录。

准备好命令依赖的结构和业务记录。配置 fixture 只分配数据库，不启动应用：开启自动执行时，`app.start()` 会执行安装，单独调用 `app.registerProviders()` 不会执行迁移。这里假设命令在查询前启动应用；如果生产命令假设数据库已经安装，则需要先在测试准备阶段完成安装。

## 运行相关检查

从应用根目录运行受影响的文件：

```bash
pnpm exec vitest run tests/components/orders.test.tsx tests/logic/orders.test.ts
pnpm exec eslint --max-warnings 0 tests/components/orders.test.tsx tests/logic/orders.test.ts
```

确认测试汇总实际包含指定文件。模板允许空测试集，所以拼错路径可能成功退出却没有执行测试。修改生产代码或构建输出时，再运行所属 TypeScript 项目和构建；只有影响范围需要全部检查时才运行 `pnpm check`。

Default 和 Examples 提供 `pnpm test:e2e`；Hub 第一次编写浏览器测试前需要配置 Playwright。先单独启动应用，再将 `APP_URL` 设为包含基础路径的完整地址。登录凭据放在环境变量中，会话状态文件不提交到 Git。布局、焦点、导航和完整操作流程需要浏览器验证，jsdom 无法验证实际布局或输入法行为。
