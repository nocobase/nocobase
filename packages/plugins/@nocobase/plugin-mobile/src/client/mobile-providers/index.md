# MobileProviders

## MobileProviders

移动端上下文组件。主要是包含：

- `AdminProvider`：用于管理用户登录状态
- `MobileTitleProvider`：用于管理页面标题
- `MobileRoutesProvider`：用于管理页面路由

```jsx | pure
<MobileProviders>
  {children}
</MobileProviders>
```

## MobileTitleProvider

用于设置页面标题。

其包含 2 个组成部分：

- `MobileTitleProvider`：用于设置上下文内容
- `useMobileTitle`：用于获取上下文内容

<code src="../demos/MobileTitleProvider-basic.tsx"></code>

## MobileRoutesProvider

用户获取移动端路由，并向子节点传递。

其包含 2 个组成部分：

- `MobileRoutesProvider`：用于设置上下文内容
- `useMobileRoutes`：用于获取上下文内容

如果获取到路由，会将当前路由的 title 通过 `useMobileTitle` 设置到页面标题。

<code src="../demos/MobileRoutesProvider-basic.tsx"></code>
