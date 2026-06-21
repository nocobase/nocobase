---
title: "FlowContext"
description: "NocoBase FlowContext API：registerFlow handler 中 ctx 对象的完整属性和方法参考。"
keywords: "FlowContext,FlowRuntimeContext,ctx,registerFlow,handler,FlowEngine,NocoBase"
---

# FlowContext

在 `registerFlow` 的 step handler 中，`ctx` 参数就是一个 `FlowRuntimeContext` 实例。通过委托链，它可以访问模型级别和引擎级别的所有属性和方法。

委托链路是：

```
FlowRuntimeContext（当前 flow 的运行时上下文）
  → FlowModelContext（model.context，模型级别）
    → FlowEngineContext（engine.context，全局级别）
```

## 常用属性

插件开发中最常用的 `ctx` 属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `ctx.model` | `FlowModel` | 当前 FlowModel 实例 |
| `ctx.api` | `APIClient` | HTTP 请求客户端，来自 `@nocobase/sdk` |
| `ctx.viewer` | `FlowViewer` | 弹窗/抽屉管理器，提供 `dialog()`、`drawer()` 等方法 |
| `ctx.message` | `MessageInstance` | Antd 的 message 实例，比如 `ctx.message.success('OK')` |
| `ctx.notification` | `NotificationInstance` | Antd 的 notification 实例 |
| `ctx.modal` | `HookAPI` | Antd 的 Modal.useModal 实例 |
| `ctx.t(key, options?)` | `(string, object?) => string` | 国际化翻译方法 |
| `ctx.router` | `Router` | react-router 路由实例 |
| `ctx.route` | `RouteOptions` | 当前路由信息（observable） |
| `ctx.location` | `Location` | 当前 URL 的 location 对象（observable） |
| `ctx.ref` | `React.RefObject` | 当前模型视图容器的 DOM ref |
| `ctx.flowKey` | `string` | 当前 flow 的 key |
| `ctx.mode` | `'runtime' \| 'settings'` | 当前执行模式，runtime 是运行时，settings 是配置面板 |
| `ctx.token` | `string` | 当前用户的认证 token |
| `ctx.role` | `string` | 当前用户的角色 |
| `ctx.auth` | `object` | 认证信息：`{ roleName, locale, token, user }` |
| `ctx.themeToken` | `object` | Antd 主题 token，用于获取主题颜色等 |
| `ctx.dataSourceManager` | `DataSourceManager` | 数据源管理器 |
| `ctx.engine` | `FlowEngine` | FlowEngine 实例 |
| `ctx.app` | `Application` | NocoBase Application 实例 |
| `ctx.i18n` | `i18n` | i18next 实例 |

## 常用方法

### 请求相关

| 方法 | 说明 |
|------|------|
| `ctx.request(options)` | 发起 HTTP 请求，内部 URL 走 `APIClient`，外部 URL 走 `axios` |
| `ctx.makeResource(ResourceClass)` | 创建一个 Resource 实例（比如 `MultiRecordResource`、`SingleRecordResource`） |
| `ctx.initResource(className)` | 在 model context 上初始化一个 resource |

### 弹窗相关

| 方法 | 说明 |
|------|------|
| `ctx.viewer.dialog(options)` | 打开对话框，`options.content` 接收 `(view) => JSX`，用 `view.close()` 关闭 |
| `ctx.viewer.drawer(options)` | 打开抽屉 |
| `ctx.openView(uid, options)` | 打开已注册的视图（popup / drawer / dialog） |

### Flow 执行控制

| 方法 | 说明 |
|------|------|
| `ctx.exit()` | 中断当前 flow 的执行 |
| `ctx.exitAll()` | 中断所有 flow 的执行 |
| `ctx.getStepParams(stepKey)` | 获取指定 step 保存的参数 |
| `ctx.setStepParams(stepKey, params)` | 设置指定 step 的参数 |
| `ctx.getStepResults(stepKey)` | 获取之前某个 step 的执行结果 |

### Action 与 Event

| 方法 | 说明 |
|------|------|
| `ctx.runAction(actionName, params?)` | 执行一个已注册的 action |
| `ctx.getAction(name)` | 获取已注册的 action 定义 |
| `ctx.getActions()` | 获取所有已注册的 action |
| `ctx.getEvents()` | 获取所有已注册的 event |

### 权限

| 方法 | 说明 |
|------|------|
| `ctx.aclCheck(params)` | 检查 ACL 权限 |
| `ctx.acl` | ACL 实例 |

### 其他

| 方法 | 说明 |
|------|------|
| `ctx.resolveJsonTemplate(template)` | 解析 `{{ ctx.xxx }}` 表达式模板 |
| `ctx.getVar(path)` | 解析单个 `ctx.xxx.yyy` 表达式路径 |
| `ctx.runjs(code, variables?, options?)` | 动态执行 JavaScript 代码 |
| `ctx.requireAsync(url)` | 动态加载模块（CommonJS 风格） |
| `ctx.importAsync(url)` | 动态加载模块（ESM 风格） |
| `ctx.loadCSS(href)` | 动态加载 CSS 文件 |
| `ctx.onRefReady(ref, callback, timeout)` | 等待 React ref 就绪后执行回调 |
| `ctx.defineProperty(key, options)` | 动态注册新属性 |
| `ctx.defineMethod(name, fn, info?)` | 动态注册新方法 |

## 插件开发中的典型用法

### 在 click handler 中弹提示

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showMessage: {
      async handler(ctx) {
        ctx.message.success(ctx.t('操作成功'));
      },
    },
  },
});
```

### 弹窗创建记录

```ts
MyModel.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    openDialog: {
      async handler(ctx) {
        ctx.viewer.dialog({
          title: ctx.t('新建记录'),
          content: (view) => <MyForm onClose={() => view.close()} />,
        });
      },
    },
  },
});
```

### 获取当前行数据（记录级操作）

```ts
MyRecordAction.registerFlow({
  key: 'clickFlow',
  on: 'click',
  steps: {
    showRecord: {
      async handler(ctx) {
        const index = ctx.model.context.recordIndex;
        const record = ctx.model.context.record;
        ctx.message.info(`第 ${index} 行: ${record.title}`);
      },
    },
  },
});
```

### 通过 resource 操作数据

```ts
async handler(ctx) {
  const resource = ctx.model.context.resource;
  // 创建记录
  await resource.create({ title: 'New item', completed: false });
  // 刷新数据
  await resource.refresh();
}
```

## 相关链接

- [FlowEngine 概述（插件开发）](../../plugin-development/client/flow-engine/index.md) — FlowModel 基础用法和 registerFlow
- [FlowDefinition 流定义](../../flow-engine/definitions/flow-definition.md) — registerFlow 的完整参数说明
- [FlowEngine 完整文档](../../flow-engine/index.md) — FlowModel、Flow 的完整参考
