# ctx.location

当前路由位置信息，与 React Router 的 `location` 对象等价。通常与 `ctx.router`、`ctx.route` 配合使用，用于读取当前路径、查询字符串、hash 以及通过路由传递的 state。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField** | 根据当前路径、查询参数或 hash 做条件渲染或逻辑分支 |
| **联动规则 / 事件流** | 读取 URL 查询参数做联动过滤，或根据 `location.state` 判断来源 |
| **路由跳转后处理** | 在目标页通过 `ctx.location.state` 接收上一页通过 `ctx.router.navigate` 传递的数据 |

> 注意：`ctx.location` 仅在存在路由上下文的 RunJS 环境中可用（如页面内的 JSBlock、事件流等）；在纯后端或无路由的上下文（如工作流）中可能为空。

## 类型定义

```ts
location: Location;
```

`Location` 来自 `react-router-dom`，与 React Router 的 `useLocation()` 返回值一致。

## 常用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `pathname` | `string` | 当前路径，以 `/` 开头（如 `/admin/users`） |
| `search` | `string` | 查询字符串，以 `?` 开头（如 `?page=1&status=active`） |
| `hash` | `string` | hash 片段，以 `#` 开头（如 `#section-1`） |
| `state` | `any` | 通过 `ctx.router.navigate(path, { state })` 传递的任意数据，不体现在 URL 中 |
| `key` | `string` | 该 location 的唯一标识，初始页为 `"default"` |

## 与 ctx.router、ctx.urlSearchParams 的关系

| 用途 | 推荐用法 |
|------|----------|
| **读取路径、hash、state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **读取查询参数（对象形式）** | `ctx.urlSearchParams`，可直接得到解析后的对象 |
| **解析 search 字符串** | `new URLSearchParams(ctx.location.search)` 或直接用 `ctx.urlSearchParams` |

`ctx.urlSearchParams` 由 `ctx.location.search` 解析而来，若只需查询参数，使用 `ctx.urlSearchParams` 更便捷。

## 示例

### 根据路径做分支

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('当前在用户管理页');
}
```

### 解析查询参数

```ts
// 方式 1：使用 ctx.urlSearchParams（推荐）
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// 方式 2：使用 URLSearchParams 解析 search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### 接收路由跳转传递的 state

```ts
// 上一页跳转时：ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('从仪表盘跳转而来');
}
```

### 根据 hash 定位锚点

```ts
const hash = ctx.location.hash; // 如 "#edit"
if (hash === '#edit') {
  // 滚动到编辑区域或执行对应逻辑
}
```

## 相关

- [ctx.router](./router.md)：路由导航，`ctx.router.navigate` 的 `state` 在目标页可通过 `ctx.location.state` 获取
- [ctx.route](./route.md)：当前路由匹配信息（参数、配置等），通常与 `ctx.location` 配合使用
