# ctx.router

基于 React Router 的路由实例，用于在流程中通过代码进行导航。

## 类型定义

```typescript
router: Router
```

`Router` 来自 `@remix-run/router`。

## 说明

`ctx.router` 是 React Router 的 `Router` 实例，在 RunJS 环境中提供导航能力。通过 `ctx.router.navigate()` 可以跳转到指定路径、替换当前路由或传递 state 数据。

## 方法

### ctx.router.navigate()

跳转到目标路径。

**签名：**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**参数：**

- `to`：目标路径（string）、相对历史位置（number，如 `-1` 表示后退）或 `null`（刷新当前页）
- `options`：可选配置
  - `replace?: boolean`：是否替换当前历史记录（默认 `false`，即 push 新记录）
  - `state?: any`：传递给目标路由的 state。该数据不会出现在 URL 中，可在目标页通过 `ctx.location.state` 访问，适用于敏感信息、临时数据或不宜放在 URL 中的信息

**示例：**

```ts
// 基础跳转（push 历史）
ctx.router.navigate('/users');

// 跳转并替换当前历史
ctx.router.navigate('/users', { replace: true });

// 跳转并传递 state
ctx.router.navigate('/users/123', { 
  state: { from: 'dashboard' } 
});

// 同时使用 replace 和 state
ctx.router.navigate('/home', { 
  replace: true,
  state: { userId: 123 }
});
```

## 注意

- `navigate()` 默认会 push 新历史记录，用户可通过浏览器后退返回
- `replace: true` 会替换当前历史记录而不新增，适用于登录后重定向等场景
- **关于 `state` 参数**：
  - 通过 `state` 传递的数据不会出现在 URL 中，适合敏感或临时数据
  - 在目标路由可通过 `ctx.location.state` 访问
  - `state` 会保存在浏览器历史中，前进/后退时仍可访问
  - 刷新页面后 `state` 会丢失
