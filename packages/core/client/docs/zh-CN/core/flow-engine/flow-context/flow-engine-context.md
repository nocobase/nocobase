# FlowEngineContext

`FlowEngineContext` 是 FlowEngine 的全局上下文对象，用于在所有流和模型中共享应用级别的服务、配置和工具。通过 `flowEngine.setContext()` 进行注册和扩展，所有流执行时都可通过 `engine.ctx` 访问这些全局能力。

---

## 注册与使用

你可以在应用初始化或 FlowEngine 实例化后，通过 `setContext` 方法注册全局上下文：

```ts
const engine = useFlowEngine();
// 或
const engine = this.flowEngine;

engine.setContext({
  // ...可扩展自定义属性
});
```

---

## 常用属性

| 属性/方法                   | 说明                                                                                  |
|----------------------------|---------------------------------------------------------------------------------------|
| `engine.ctx.app`           | 当前应用实例，可用于访问应用级别的服务和资源。                                         |
| `engine.ctx.api`           | 当前 apiClient，用于发起客户端请求。                                                   |
| `engine.ctx.auth`          | 用户认证信息，包含当前用户、权限、登录状态等。                                        |
| `engine.ctx.t`             | 翻译函数，支持多语言文本。                                                             |
| `engine.ctx.i18n`          | 国际化对象，包含当前语言、切换语言等能力。                                             |
| `engine.ctx.dataSourceManager` | 数据源管理器实例（数据源 2.0），统一管理多数据源。                              |
| `engine.ctx.router`        | 路由对象，支持页面跳转、路由参数获取等。                                               |
| `engine.ctx.viewOpener`    | 视图容器/打开器，统一管理页面、抽屉、对话框、Popover 等视图的打开与关闭。              |
| `engine.ctx.message`       | 消息提示工具，支持 info、success、error、warning 等。                                  |
| `engine.ctx.themeToken`    | 主题变量，支持自定义主题色、字体等。                                                   |
| `engine.ctx.antdConfig`    | antd 配置对象，支持 antd 主题、国际化等全局配置。                                      |

---

## 用法示例

```ts
// 在流步骤或模型中访问全局上下文
const { app, api, t, message, router } = engine.ctx;

// 发送 API 请求
const result = await api.request({
  url: '/users:list',
});

// 国际化
const text = t('hello');

// 显示消息
message.success('操作成功');

// 跳转页面
router.push('/dashboard');

// 打开抽屉或对话框
viewOpener.open({ mode: 'drawer', title: '详情', content: <DetailView /> });
```
