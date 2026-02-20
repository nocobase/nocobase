# ctx.router

基于 React Router 的路由实例，用于在 RunJS 中通过代码进行导航。通常与 `ctx.route`、`ctx.location` 配合使用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField** | 按钮点击后跳转到详情页、列表页或外部链接 |
| **联动规则 / 事件流** | 提交成功后 `navigate` 到列表或详情，或传递 state 到目标页 |
| **JSAction / 事件处理** | 在表单提交、链接点击等逻辑中执行路由跳转 |
| **视图导航** | 内部视图栈切换时通过 `navigate` 更新 URL |

> 注意：`ctx.router` 仅在存在路由上下文的 RunJS 环境中可用（如页面内的 JSBlock、Flow 页面、事件流等）；在纯后端或无路由的上下文（如工作流）中可能为空。

## 类型定义

```typescript
router: Router
```

`Router` 来自 `@remix-run/router`，在 RunJS 中通过 `ctx.router.navigate()` 实现跳转、后退、刷新等导航操作。

## 方法

### ctx.router.navigate()

跳转到目标路径，或执行后退/刷新。

**签名：**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**参数：**

- `to`：目标路径（string）、相对历史位置（number，如 `-1` 表示后退）或 `null`（刷新当前页）
- `options`：可选配置
  - `replace?: boolean`：是否替换当前历史记录（默认 `false`，即 push 新记录）
  - `state?: any`：传递给目标路由的 state。该数据不会出现在 URL 中，可在目标页通过 `ctx.location.state` 访问，适用于敏感信息、临时数据或不宜放在 URL 中的信息

## 示例

### 基础跳转

```ts
// 跳转到用户列表（push 新历史，可后退）
ctx.router.navigate('/admin/users');

// 跳转到详情页
ctx.router.navigate(`/admin/users/${recordId}`);
```

### 替换历史（无新增记录）

```ts
// 登录后重定向到首页，用户后退不会回到登录页
ctx.router.navigate('/admin', { replace: true });

// 表单提交成功后替换当前页为详情页
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### 传递 state

```ts
// 跳转时携带数据，目标页通过 ctx.location.state 获取
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### 后退与刷新

```ts
// 后退一页
ctx.router.navigate(-1);

// 后退两页
ctx.router.navigate(-2);

// 刷新当前页
ctx.router.navigate(null);
```

## 与 ctx.route、ctx.location 的关系

| 用途 | 推荐用法 |
|------|----------|
| **导航跳转** | `ctx.router.navigate(path)` |
| **读取当前路径** | `ctx.route.pathname` 或 `ctx.location.pathname` |
| **读取跳转时传递的 state** | `ctx.location.state` |
| **读取路由参数** | `ctx.route.params` |

`ctx.router` 负责「导航动作」，`ctx.route` 和 `ctx.location` 负责「当前路由状态」。

## 注意

- `navigate(path)` 默认会 push 新历史记录，用户可通过浏览器后退返回
- `replace: true` 会替换当前历史记录而不新增，适用于登录后重定向、提交成功跳转等场景
- **关于 `state` 参数**：
  - 通过 `state` 传递的数据不会出现在 URL 中，适合敏感或临时数据
  - 在目标页可通过 `ctx.location.state` 访问
  - `state` 会保存在浏览器历史中，前进/后退时仍可访问
  - 刷新页面后 `state` 会丢失

## 相关

- [ctx.route](./route.md)：当前路由匹配信息（pathname、params 等）
- [ctx.location](./location.md)：当前 URL 位置（pathname、search、hash、state），跳转后 `state` 在此读取
