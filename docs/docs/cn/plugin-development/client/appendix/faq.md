---
title: "常见问题 & 排错指南"
description: "NocoBase 客户端插件开发常见问题：插件不显示、区块不出现、翻译不生效、路由找不到、热更新不生效、构建打包报错、部署后启动失败等问题排查。"
keywords: "FAQ,常见问题,排错指南,Troubleshooting,NocoBase,构建,部署,tar,axios"
---

# 常见问题 & 排错指南

这里整理了开发客户端插件时比较容易踩的坑。如果你遇到了"明明写对了但就是不生效"的情况，可以先来这里找找看。

## 插件相关

### 插件创建后在管理器里看不到

确认执行了 `yarn pm create` 而不是手动创建目录。`yarn pm create` 除了生成文件，还会把插件注册到数据库的 `applicationPlugins` 表里。如果手动创建了目录，可以执行 `yarn nocobase upgrade` 重新扫描。

### 插件启用后页面没有变化

按以下顺序排查：

1. 确认执行了 `yarn pm enable <pluginName>`
2. 刷新浏览器（有时候需要强制刷新 `Ctrl+Shift+R`）
3. 检查浏览器控制台有没有报错

### 修改代码后页面没有更新

不同类型的文件，热更新行为不一样：

| 文件类型 | 修改后需要 |
| --- | --- |
| `src/client-v2/` 下的 tsx/ts | 自动热更新，不需要操作 |
| `src/locale/` 下的翻译文件 | **重启应用** |
| `src/server/collections/` 下新增或修改 collection | 执行 `yarn nocobase upgrade` |

如果客户端代码改了但没热更新，先试试刷新浏览器。

## 路由相关

### 注册的页面路由访问不到

NocoBase v2 的路由会默认加上 `/v2` 前缀。比如你注册了 `path: '/hello'`，实际访问地址是 `/v2/hello`：

```ts
this.router.add('hello', {
  path: '/hello', // 实际访问 -> /v2/hello
  componentLoader: () => import('./pages/HelloPage'),
});
```

详见 [Router 路由](../router)。

### 插件设置页点进去是空白

如果设置页菜单出现了但内容为空，通常是两个原因之一：

**原因一：v1 client 用了 `componentLoader`**

`componentLoader` 是 client-v2 的写法，v1 client 要用 `Component` 直接传组件：

```ts
// ❌ v1 client 不支持 componentLoader
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  componentLoader: () => import('./pages/MyPage'),
});

// ✅ v1 client 用 Component
import MyPage from './pages/MyPage';
this.pluginSettingsManager.addPageTabItem({
  menuKey: 'my-settings',
  key: 'index',
  Component: MyPage,
});
```

**原因二：页面组件没有用 `export default` 导出**

`componentLoader` 需要模块有默认导出，漏了 `default` 就加载不到。

## 区块相关

### 自定义区块在「添加区块」菜单里看不到

确认在 `load()` 里注册了模型：

```ts
this.flowEngine.registerModelLoaders({
  MyBlockModel: {
    loader: () => import('./models/MyBlockModel'),
  },
});
```

如果用的是 `registerModels`（非按需加载写法），确认 `models/index.ts` 里正确导出了模型。

### 添加区块后，数据表选择列表里没有我的表

通过 `defineCollection` 定义的表是服务端内部表，默认不会出现在 UI 的数据表列表中。

**推荐做法**：在 NocoBase 界面的「[数据源管理](../../../data-sources/data-source-main/index.md)」中添加对应的数据表，配置好字段和接口类型后，表就会自动出现在区块的数据表选择列表里。

如果确实需要在插件代码里注册（比如示例插件里的演示场景），可以通过 `addCollection` 手动注册，详见 [做一个前后端联动的数据管理插件](../examples/fullstack-plugin)。注意必须通过 `eventBus` 模式注册，不能直接在 `load()` 里调用——`ensureLoaded()` 会在 `load()` 之后清空并重新设置所有 collection。

### 自定义区块只想绑定特定数据表

在模型上覆盖 `static filterCollection`，返回 `true` 的 collection 才会出现在选择列表里：

```ts
export class MyBlockModel extends TableBlockModel {
  static filterCollection(collection: Collection) {
    return collection.name === 'myTable';
  }
}
```

## 字段相关

### 自定义字段组件在「字段组件」下拉菜单里看不到

按以下顺序排查：

1. 确认调用了 `DisplayItemModel.bindModelToInterface('ModelName', ['input'])`，并且 interface 类型匹配——比如 `input` 对应单行文本字段，`checkbox` 对应复选框
2. 确认模型在 `load()` 里注册了（`registerModels` 或 `registerModelLoaders`）
3. 确认字段模型调用了 `define({ label })`

### 字段组件下拉菜单里显示的是类名

忘了在字段模型上调用 `define({ label })`，加上就行：

```ts
MyFieldModel.define({
  label: tExpr('My field'),
});
```

同时确保 `src/locale/` 下的翻译文件里有对应的 key，不然中文环境下还是显示英文原文。

## 操作相关

### 自定义操作按钮在「配置操作」里看不到

确认模型上设置了正确的 `static scene`：

| 值 | 出现位置 |
| --- | --- |
| `ActionSceneEnum.collection` | 区块顶部操作栏（比如「新建」按钮旁边） |
| `ActionSceneEnum.record` | 表格每行的操作列（比如「编辑」「删除」旁边） |
| `ActionSceneEnum.both` | 两种场景都出现 |

### 点击操作按钮没有反应

确认 `registerFlow` 的 `on` 设置为 `'click'`：

```ts
MyActionModel.registerFlow({
  key: 'myFlow',
  on: 'click', // 监听按钮点击
  steps: {
    doSomething: {
      async handler(ctx) {
        // 你的逻辑
      },
    },
  },
});
```

:::warning 注意

`registerFlow` 里的 `uiSchema` 是配置面板（设置态）的 UI，不是运行时弹窗。如果你想在点击按钮后弹出一个表单，应该在 `handler` 里用 `ctx.viewer.dialog()` 来打开弹窗。

:::

## 国际化相关

### 翻译不生效

最常见的原因：

- **初次添加** `src/locale/` 目录或文件——需要重启应用才能生效
- **翻译 key 不一致**——确认 key 和代码里的字符串完全一致，注意空格和大小写
- **组件里直接用了 `ctx.t()`**——`ctx.t()` 不会自动注入插件的 namespace，在组件里应该用 `useT()` hook（从 `locale.ts` 导入）

### `tExpr()` 和 `useT()` 和 `this.t()` 用错场景

这三个翻译方法的使用场景不同，用错了要么报错要么翻译不生效：

| 方法 | 用在哪里 | 说明 |
| --- | --- | --- |
| `tExpr()` | `define()`、`registerFlow()` 等静态定义 | 模块加载时 i18n 还没初始化，用延迟翻译 |
| `useT()` | React 组件内部 | 返回绑定了插件 namespace 的翻译函数 |
| `this.t()` | Plugin 的 `load()` 里 | 自动注入插件包名作为 namespace |

详见 [i18n 国际化](../component/i18n)。

## API 请求相关

### 请求返回 403 Forbidden

通常是服务端的 ACL 没有配置。比如你的 collection 叫 `todoItems`，需要在服务端插件的 `load()` 里允许对应的操作：

```ts
// 只允许查询
this.app.acl.allow('todoItems', ['list', 'get'], 'loggedIn');

// 允许完整增删改查
this.app.acl.allow('todoItems', ['list', 'get', 'create', 'update', 'destroy'], 'loggedIn');
```

`'loggedIn'` 表示登录用户即可访问。如果不设置 `acl.allow`，默认只有管理员能操作。

### 请求返回 404 Not Found

按以下顺序排查：

- 如果用的是 `defineCollection`，确认 collection 名称拼写正确
- 如果用的是 `resourceManager.define`，确认 resource 名称和 action 名称都对
- 检查请求 URL 格式——NocoBase 的 API 格式是 `resourceName:actionName`，比如 `todoItems:list`、`externalApi:get`

## 构建和部署相关

### `yarn build --tar` 报错 "no paths specified to add to archive"

执行 `yarn build <pluginName> --tar` 时报错：

```bash
TypeError: no paths specified to add to archive
```

不过单独执行 `yarn build <pluginName>`（不带 `--tar`）是正常的。

这个问题通常是因为插件的 `.npmignore` 里**用了取反语法**（npm 的 `!` 前缀）。`--tar` 打包时，NocoBase 会读取 `.npmignore` 的每一行并在前面加上 `!` 转成 `fast-glob` 的排除模式。如果你的 `.npmignore` 已经用了取反语法，比如：

```
*
!dist
!package.json
```

处理后会变成 `['!*', '!!dist', '!!package.json', '**/*']`。其中 `!*` 会排除所有根级文件（包括 `package.json`），而 `!!dist` 并不会被 `fast-glob` 识别为"重新包含 dist"——取反失效了。如果 `dist/` 目录恰好为空或者构建没有产出文件，最终收集到的文件列表就是空的，`tar` 就会抛出这个错误。

**解决办法：** `.npmignore` 里不要用取反语法，改成只列出需要排除的目录：

```
/node_modules
/src
```

打包逻辑会把这些转换成排除模式（`!./node_modules`、`!./src`），再加上 `**/*` 匹配所有其他文件。这样写既简单又不会遇到取反处理的问题。

### 插件上传到生产环境后启用失败（本地正常）

插件在本地开发时一切正常，但通过「插件管理器」上传到生产环境后启用失败，日志里出现类似这样的报错：

```bash
TypeError: Cannot assign to read only property 'constructor' of object '[object Object]'
```

这个问题通常是因为**插件把 NocoBase 内置的依赖打包进了自己的 `node_modules/`**。NocoBase 的构建系统维护了一份 [external 列表](../../dependency-management)，里面的包（比如 `react`、`antd`、`axios`、`lodash` 等）由 NocoBase 宿主提供，不应该被打包进插件。如果插件带了一份私有的副本，运行时可能会和宿主已经加载的版本冲突，引发各种奇怪的错误。

**为什么本地没问题：** 本地开发时插件在 `packages/plugins/` 目录下，没有私有 `node_modules/`，依赖会解析到项目根目录下已经加载好的版本，不会产生冲突。

**解决办法：** 把插件 `package.json` 里的 `dependencies` 都移到 `devDependencies`——NocoBase 的构建系统会自动处理插件的依赖：

```diff
{
- "dependencies": {
-   "axios": "1.7.7"
- },
+ "devDependencies": {
+   "axios": "1.7.7"
+ },
}
```

然后重新构建并打包。这样插件的 `dist/node_modules/` 就不会包含这些包，运行时会使用 NocoBase 宿主提供的版本。

:::tip 通用原则

NocoBase 的构建系统维护了一份 [external 列表](../../dependency-management)，里面的包（比如 `react`、`antd`、`axios`、`lodash` 等）由 NocoBase 宿主提供，插件不应该自己打包。插件的所有依赖都应该放在 `devDependencies` 里，构建系统会自动判断哪些需要打包进 `dist/node_modules/`、哪些由宿主提供。

:::

## 相关链接

- [Plugin 插件](../plugin) — 插件入口和生命周期
- [Router 路由](../router) — 路由注册和 `/v2` 前缀
- [FlowEngine 概述](../flow-engine/index.md) — FlowModel 基础用法
- [FlowEngine → 区块扩展](../flow-engine/block) — BlockModel、TableBlockModel、filterCollection
- [FlowEngine → 字段扩展](../flow-engine/field) — FieldModel、bindModelToInterface
- [FlowEngine → 操作扩展](../flow-engine/action) — ActionModel、ActionSceneEnum
- [i18n 国际化](../component/i18n) — 翻译文件、useT、tExpr 用法
- [Context → 常用能力](../ctx/common-capabilities) — ctx.api、ctx.viewer 等
- [服务端 → Collections 数据表](../../server/collections) — defineCollection 和 addCollection
- [服务端 → ACL 权限控制](../../server/acl) — 接口权限配置
- [插件构建](../../build) — 构建配置、external 列表、打包流程
