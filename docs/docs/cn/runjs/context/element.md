# ctx.element

指向沙箱 DOM 容器的 ElementProxy 实例。

## 类型定义

```typescript
element: ElementProxy
```

## 说明

`ctx.element` 是指向沙箱 DOM 容器的 ElementProxy。**出于安全考虑，不要直接使用 `ctx.element` 的 API**（如 `innerHTML`、`appendChild`、`querySelector` 等）。

NocoBase 的 JS 区块会指定一个 element，该 element 是 Element 对象的代理 ElementProxy，对外只暴露安全可用的属性和方法。

## 安全要求

**禁止直接使用 `ctx.element` 的 API。** 所有 DOM 操作应通过 `ctx.render()` 完成。

### ❌ 错误用法

```ts
// ❌ 不允许：直接使用 ctx.element 的 API
ctx.element.innerHTML = '<div>内容</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

### ✅ 正确用法：使用 ctx.render()

所有渲染应使用 `ctx.render()`：

```ts
// ✅ 正确：用 ctx.render() 渲染 React 组件
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('欢迎')}>
    <Button type="primary">点击</Button>
  </Card>
);
```

```ts
// ✅ 正确：用 ctx.render() 渲染 HTML 字符串
ctx.render('<div style="padding:16px;">' + ctx.t('内容') + '</div>');
```

```ts
// ✅ 正确：用 ctx.render() 渲染 DOM 节点
const div = document.createElement('div');
div.textContent = ctx.t('你好');
ctx.render(div);
```

## 为何必须使用 ctx.render()

使用 `ctx.render()` 的好处：

- **安全**：集中安全控制，避免直接操作 DOM 带来的风险
- **React 支持**：完整支持 React 与 JSX
- **上下文继承**：自动继承应用上下文
- **生命周期**：更好的组件生命周期管理
- **冲突处理**：自动管理 React 根的创建/卸载，避免冲突

## 注意

- `ctx.element` 仅作为 `ctx.render()` 的内部容器使用
- 不要直接访问或修改 `ctx.element` 的任何属性或方法
- 所有渲染必须通过 `ctx.render()` 进行
