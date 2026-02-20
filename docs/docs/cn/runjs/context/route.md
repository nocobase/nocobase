# ctx.route

当前路由匹配信息，与 React Router 的 route 概念对应，用于获取当前匹配的路由配置、参数等。通常与 `ctx.router`、`ctx.location` 配合使用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField** | 根据 `route.pathname` 或 `route.params` 做条件渲染、显示当前页面标识 |
| **联动规则 / 事件流** | 读取路由参数（如 `params.name`）做逻辑分支或传递给子组件 |
| **视图导航** | 内部通过 `ctx.route.pathname` 与目标路径比较，决定是否触发 `ctx.router.navigate` |

> 注意：`ctx.route` 仅在存在路由上下文的 RunJS 环境中可用（如页面内的 JSBlock、Flow 页面等）；在纯后端或无路由的上下文（如工作流）中可能为空。

## 类型定义

```ts
type RouteOptions = {
  name?: string;   // 路由唯一标识
  path?: string;   // 路由模板（如 /admin/:name）
  params?: Record<string, any>;  // 路由参数（如 { name: 'users' }）
  pathname?: string;  // 当前路由的完整路径（如 /admin/users）
};
```

## 常用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `pathname` | `string` | 当前路由的完整路径，与 `ctx.location.pathname` 一致 |
| `params` | `Record<string, any>` | 从路由模板中解析出的动态参数，如 `{ name: 'users' }` |
| `path` | `string` | 路由模板，如 `/admin/:name` |
| `name` | `string` | 路由唯一标识，常用于多 Tab、多视图场景 |

## 与 ctx.router、ctx.location 的关系

| 用途 | 推荐用法 |
|------|----------|
| **读取当前路径** | `ctx.route.pathname` 或 `ctx.location.pathname`，二者在匹配时一致 |
| **读取路由参数** | `ctx.route.params`，如 `params.name` 表示当前页面 UID |
| **导航跳转** | `ctx.router.navigate(path)` |
| **读取查询参数、state** | `ctx.location.search`、`ctx.location.state` |

`ctx.route` 侧重「匹配到的路由配置」，`ctx.location` 侧重「当前 URL 位置」，二者配合可完整描述当前路由状态。

## 示例

### 读取 pathname

```ts
// 显示当前路径
ctx.message.info('当前页面: ' + ctx.route.pathname);
```

### 根据 params 做分支

```ts
// params.name 通常为当前页面 UID（如 flow 页面标识）
if (ctx.route.params?.name === 'users') {
  // 在用户管理页执行特定逻辑
}
```

### 在 Flow 页面中展示

```tsx
<div>
  <h1>当前页面 - {ctx.route.pathname}</h1>
  <p>路由标识: {ctx.route.params?.name}</p>
</div>
```

## 相关

- [ctx.router](./router.md)：路由导航，`ctx.router.navigate()` 改变路径后，`ctx.route` 会随之更新
- [ctx.location](./location.md)：当前 URL 位置（pathname、search、hash、state），与 `ctx.route` 配合使用
