# ctx.router

React Router 实例，用于在流程中进行命令式导航。

## 类型定义

```typescript
router: Router
```

其中 `Router` 来自 `@remix-run/router`。

## 说明

`ctx.router` 是 React Router 的 Router 实例，提供了在 RunJS 执行环境中进行路由导航的能力。通过 `ctx.router.navigate()`，你可以在流程中导航到指定路径、替换当前路由或传递状态数据。

## 方法

### ctx.router.navigate()

导航到指定路径。

**签名：**
```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**参数：**
- `to`: 目标路径（字符串）、历史记录中的相对位置（数字，如 `-1` 表示后退），或 `null`（表示刷新当前页面）
- `options`: 可选配置对象
  - `replace?: boolean`: 是否替换当前历史记录条目（默认为 `false`，即添加新条目）
  - `state?: any`: 传递给目标路由的状态数据。这些数据不会出现在 URL 中，可以通过 `ctx.location.state` 在目标路由中访问。适合传递敏感信息、临时数据或不需要在 URL 中显示的额外信息。

**示例：**

```ts
// 基本导航（添加历史记录）
ctx.router.navigate('/users');

// 导航并替换当前历史记录
ctx.router.navigate('/users', { replace: true });

// 导航并传递状态
ctx.router.navigate('/users/123', { 
  state: { from: 'dashboard' } 
});

// 同时使用 replace 和 state
ctx.router.navigate('/home', { 
  replace: true,
  state: { userId: 123 }
});
```

## 注意事项

- `navigate()` 默认会添加新的历史记录条目，用户可以通过浏览器后退按钮返回
- 使用 `replace: true` 会替换当前历史记录条目，不会添加新条目，适合登录后跳转等场景
- **`state` 参数说明**：
  - 通过 `state` 传递的数据不会出现在 URL 中，适合传递敏感信息、临时数据或不需要在 URL 中显示的额外信息
  - 在目标路由中，可以通过 `ctx.location.state` 访问传递的状态数据
  - `state` 数据会保存在浏览器历史记录中，用户使用后退/前进按钮时仍可访问
  - 刷新页面后，`state` 数据会丢失

## 使用示例

- [基本导航](./router-basic.md)
- [替换路由](./router-replace.md)
- [使用 state 传递数据](./router-state.md)
- [在事件处理中使用](./router-event-handler.md)
