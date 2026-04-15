---
title: "常用能力"
description: "NocoBase 客户端上下文常用能力：ctx.api 请求、ctx.t 国际化、ctx.logger 日志、ctx.router 路由、ctx.viewer 视图管理、ctx.acl 权限控制。"
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# 常用能力

上下文对象提供了 NocoBase 的各项内置能力。不过有些能力只在 Plugin 里可用，有些只在组件里可用，有些两边都有但写法不同。先看一下总览：

| 能力       | Plugin（`this.xxx`）          | Component（`ctx.xxx`）       | 说明                              |
| ---------- | ----------------------------- | ---------------------------- | --------------------------------- |
| API 请求   | `this.context.api`            | `ctx.api`                    | 用法一致                          |
| 国际化     | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` 自动注入插件 namespace |
| 日志       | `this.context.logger`         | `ctx.logger`                 | 用法一致                          |
| 路由注册   | `this.router.add()`           | -                            | 仅 Plugin                         |
| 页面导航   | -                             | `ctx.router.navigate()`      | 仅组件                            |
| 路由信息   | `this.context.location`       | `ctx.route` / `ctx.location` | 建议在组件中使用                  |
| 视图管理   | `this.context.viewer`         | `ctx.viewer`                 | 打开弹窗 / 抽屉等                 |
| FlowEngine | `this.flowEngine`             | -                            | 仅 Plugin                         |

下面按 namespace 逐项介绍。

## API 请求（ctx.api）

通过 `ctx.api.request()` 调用后端接口，用法和 [Axios](https://axios-http.com/) 一致。

### 在 Plugin 中使用

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 在 load() 里直接发请求
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('应用信息', response.data);
  }
}
```

### 在组件中使用

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET 请求
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST 请求
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>加载数据</button>;
}
```

### 搭配 ahooks useRequest

在组件中，可以用 [ahooks](https://ahooks.js.org/hooks/use-request/index) 的 `useRequest` 来简化请求的状态管理：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>请求出错: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### 请求拦截器

通过 `ctx.api.axios` 可以添加请求/响应拦截器，通常在 Plugin 的 `load()` 中设置：

```ts
async load() {
  // 请求拦截器：添加自定义请求头
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // 响应拦截器：统一错误处理
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('请求出错', error);
      return Promise.reject(error);
    },
  );
}
```

### NocoBase 自定义请求头

NocoBase Server 支持以下自定义请求头，通常由拦截器自动注入，不需要手动设置：

| Header            | 说明                              |
| ----------------- | --------------------------------- |
| `X-App`           | 多应用场景下指定当前访问的应用    |
| `X-Locale`        | 当前语言（比如 `zh-CN`、`en-US`） |
| `X-Hostname`      | 客户端主机名                      |
| `X-Timezone`      | 客户端所在时区（比如 `+08:00`）   |
| `X-Role`          | 当前角色                          |
| `X-Authenticator` | 当前用户认证方式                  |

## 国际化（ctx.t / ctx.i18n）

NocoBase 插件通过 `src/locale/` 目录管理多语言文件，通过 `ctx.t()` 在代码中使用翻译。

### 多语言文件

在插件的 `src/locale/` 下按语言创建 JSON 文件：

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning 注意

初次添加语言文件需要重启应用才能生效。

:::

### ctx.t()

在组件中通过 `ctx.t()` 获取翻译文本：

```tsx
const ctx = useFlowContext();

// 基本用法
ctx.t('Hello');

// 带变量
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// 指定命名空间（默认命名空间是插件的包名）
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

在 Plugin 里用 `this.t()` 更方便——它会**自动把插件的包名注入为 namespace**，不需要手动传 `ns`：

```ts
class MyPlugin extends Plugin {
  async load() {
    // 自动使用当前插件的包名作为 ns
    console.log(this.t('Hello'));

    // 等同于
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` 是底层的 [i18next](https://www.i18next.com/) 实例，通常来说直接用 `ctx.t()` 就够了。不过如果你需要动态切换语言、监听语言变化等，可以用 `ctx.i18n`：

```ts
// 获取当前语言
const currentLang = ctx.i18n.language; // 'zh-CN'

// 监听语言变化
ctx.i18n.on('languageChanged', (lng) => {
  console.log('语言切换为', lng);
});
```

### tExpr()

`tExpr()` 用于生成延迟翻译的表达式字符串，通常在 `FlowModel.define()` 里使用——因为 define 是在模块加载时执行的，此时还没有 i18n 实例：

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // 生成 '{{t("Hello block")}}'，运行时再翻译
});
```

更完整的国际化用法（翻译文件写法、useT hook、tExpr 等）见 [i18n 国际化](../component/i18n)。NocoBase 支持的语言代码完整列表见 [语言列表](../../languages)。

## 日志（ctx.logger）

通过 `ctx.logger` 输出结构化日志，基于 [pino](https://github.com/pinojs/pino)。

### 在 Plugin 中使用

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('插件加载完成', { plugin: 'my-plugin' });
    this.context.logger.error('初始化失败', { error });
  }
}
```

### 在组件中使用

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('页面加载完成', { page: 'UserList' });
    ctx.logger.debug('当前用户状态', { user });
  };

  // ...
}
```

日志级别从高到低：`fatal` > `error` > `warn` > `info` > `debug` > `trace`。只有大于或等于当前配置级别的日志才会输出。

## 路由（ctx.router / ctx.route / ctx.location）

路由相关能力分为三部分：注册（仅 Plugin）、导航和信息获取（仅组件）。

### 路由注册（this.router / this.pluginSettingsManager）

在 Plugin 的 `load()` 中通过 `this.router.add()` 注册页面路由，通过 `this.pluginSettingsManager` 注册插件设置页：

```ts
async load() {
  // 注册普通页面路由
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // 注册插件设置页（会出现在「插件配置」菜单里）
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Ant Design 图标，参考 https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

详细用法见 [Router 路由](../router)。完整的设置页示例见 [做一个插件设置页](../examples/settings-page)。

:::warning 注意

`this.router` 是 RouterManager，用于**注册路由**。`this.pluginSettingsManager` 是 PluginSettingsManager，用于**注册设置页**。两者跟组件里的 `ctx.router`（React Router，用于**页面导航**）不是同一个东西。

:::

### 页面导航（ctx.router）

在组件中通过 `ctx.router.navigate()` 进行页面跳转：

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### 路由信息（ctx.route）

在组件中通过 `ctx.route` 获取当前路由信息：

```tsx
const ctx = useFlowContext();

// 获取动态参数（比如路由定义为 /users/:id）
const { id } = ctx.route.params;

// 获取路由名字
const { name } = ctx.route;
```

`ctx.route` 的完整类型：

```ts
interface RouteOptions {
  name?: string;         // 路由唯一标识
  path?: string;         // 路由模板
  pathname?: string;     // 路由的完整路径
  params?: Record<string, any>; // 路由参数
}
```

### 当前 URL（ctx.location）

`ctx.location` 提供当前 URL 的详细信息，类似浏览器的 `window.location`：

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

`ctx.route` 和 `ctx.location` 虽然在 Plugin 里也能通过 `this.context` 访问到，不过插件加载时的 URL 是不确定的，拿到的值没有意义。建议在组件中使用。

## 视图管理（ctx.viewer / ctx.view）

`ctx.viewer` 提供了命令式打开弹窗、抽屉等视图的能力。在 Plugin 和组件中都可以用。

### 在 Plugin 中使用

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 比如在某个初始化逻辑中打开一个弹窗
    this.context.viewer.dialog({
      title: '欢迎',
      content: () => <div>插件初始化完成</div>,
    });
  }
}
```

### 在组件中使用

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // 打开弹窗
    ctx.viewer.dialog({
      title: '编辑用户',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // 打开抽屉
    ctx.viewer.drawer({
      title: '详情',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>编辑</Button>
      <Button onClick={openDrawer}>查看详情</Button>
    </div>
  );
}
```

### 通用方法

```tsx
// 通过 type 指定视图类型
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: '标题',
  content: () => <SomeComponent />,
});
```

### 在视图内部操作（ctx.view）

在弹窗/抽屉内部的组件中，可以通过 `ctx.view` 来操作当前视图（比如关闭）：

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>弹窗内容</p>
      <Button onClick={() => ctx.view.close()}>关闭</Button>
    </div>
  );
}
```

## FlowEngine（this.flowEngine）

`this.flowEngine` 是 FlowEngine 实例，仅在 Plugin 中可用。通常用它来注册 FlowModel：

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 注册 FlowModel（推荐按需加载写法）
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel 是 NocoBase 可视化配置体系的核心——如果你的组件需要出现在「添加区块 / 字段 / 操作」菜单里，就需要通过 FlowModel 来包装。详细用法见 [FlowEngine](../flow-engine/index.md)。

## 更多能力

以下能力在更高级的场景中可能用到，这里简要列出：

| 属性                    | 说明                                            |
| ----------------------- | ----------------------------------------------- |
| `ctx.model`             | 当前 FlowModel 实例（在 Flow 执行上下文中可用） |
| `ctx.ref`               | 组件引用，搭配 `ctx.onRefReady` 使用            |
| `ctx.exit()`            | 退出当前 Flow 的执行                            |
| `ctx.defineProperty()`  | 向上下文动态添加自定义属性                      |
| `ctx.defineMethod()`    | 向上下文动态添加自定义方法                      |
| `ctx.useResource()`     | 获取数据资源操作接口                            |
| `ctx.dataSourceManager` | 数据源管理                                      |

这些能力的详细用法可以参考 [FlowEngine 完整文档](../../../flow-engine/index.md)。

## 相关链接

- [Context 上下文概述](../ctx/index.md) — 两种上下文入口的异同
- [Plugin 插件](../plugin) — Plugin 快捷属性
- [Component 组件开发](../component/index.md) — useFlowContext 在组件中的用法
- [Router 路由](../router) — 路由注册和导航
- [FlowEngine 完整文档](../../../flow-engine/index.md) — 完整的 FlowEngine 参考
- [i18n 国际化](../component/i18n) — 翻译文件写法、tExpr、useT
- [语言列表](../../languages) — NocoBase 支持的语言代码
- [做一个插件设置页](../examples/settings-page) — ctx.api 的完整使用示例
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
