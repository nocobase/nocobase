# ctx.element

ElementProxy 实例，指向沙箱化的 DOM 容器。

## 类型定义

```typescript
element: ElementProxy
```

## 说明

`ctx.element` 是一个 ElementProxy，指向沙箱化的 DOM 容器。**为了安全考虑，不应直接使用 `ctx.element` 的 API**（如 `innerHTML`、`appendChild`、`querySelector` 等）。

## 安全要求

**禁止直接使用 `ctx.element` 的 API**，所有 DOM 操作都应通过 `ctx.render()` 完成。

### ❌ 错误用法

```ts
// ❌ 禁止：直接使用 ctx.element 的 API
ctx.element.innerHTML = '<div>Content</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

### ✅ 正确用法：使用 ctx.render()

所有内容渲染都应使用 `ctx.render()`：

```ts
// ✅ 正确：使用 ctx.render() 渲染 React 组件
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Welcome')}>
    <Button type="primary">Click</Button>
  </Card>
);
```

```ts
// ✅ 正确：使用 ctx.render() 渲染 HTML 字符串
ctx.render('<div style="padding:16px;">' + ctx.t('Content') + '</div>');
```

```ts
// ✅ 正确：使用 ctx.render() 渲染 DOM 节点
const div = document.createElement('div');
div.textContent = ctx.t('Hello');
ctx.render(div);
```

## 为什么必须使用 ctx.render()

使用 `ctx.render()` 的优势：
- **安全性**：统一的安全控制，避免直接 DOM 操作带来的风险
- **React 支持**：支持完整的 React 功能和 JSX
- **上下文继承**：自动继承应用的上下文
- **生命周期管理**：更好的组件生命周期管理
- **冲突处理**：自动处理 React 根的创建和卸载，避免冲突

## 注意事项

- `ctx.element` 仅作为 `ctx.render()` 的内部容器使用
- 不要直接访问或操作 `ctx.element` 的任何属性或方法
- 所有渲染操作必须通过 `ctx.render()` 完成
