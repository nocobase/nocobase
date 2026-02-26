# ctx.element

指向沙箱 DOM 容器的 ElementProxy 实例，作为 `ctx.render()` 的默认渲染目标。在 JSBlock、JSField、JSItem、JSColumn 等有渲染容器的场景下可用。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | 区块的 DOM 容器，渲染区块自定义内容 |
| **JSField / JSItem / FormJSFieldItem** | 字段/表单项的渲染容器（通常为 `<span>`） |
| **JSColumn** | 表格单元格的 DOM 容器，渲染自定义列内容 |

> 注意：`ctx.element` 仅在存在渲染容器的 RunJS 上下文中可用；无 UI 上下文的场景（如纯后端逻辑）可能为 `undefined`，使用前建议做空值判断。

## 类型定义

```typescript
element: ElementProxy | undefined;

// ElementProxy 对原始 HTMLElement 的代理，对外暴露安全 API
class ElementProxy {
  __el: HTMLElement;  // 内部持有的原生 DOM 元素（仅个别场景需访问）
  innerHTML: string;  // 读写时经 DOMPurify 清洗
  outerHTML: string; // 同上
  appendChild(child: HTMLElement | string): void;
  // 其他 HTMLElement 方法透传（不推荐直接使用）
}
```

## 安全要求

**推荐：所有渲染通过 `ctx.render()` 完成。** 不要直接使用 `ctx.element` 的 DOM API（如 `innerHTML`、`appendChild`、`querySelector` 等）。

### 为何推荐 ctx.render()

| 优势 | 说明 |
|------|------|
| **安全** | 集中安全控制，避免 XSS 与不当 DOM 操作 |
| **React 支持** | 完整支持 JSX、React 组件与生命周期 |
| **上下文继承** | 自动继承应用 ConfigProvider、主题等 |
| **冲突处理** | 自动管理 React 根创建/卸载，避免多实例冲突 |

### ❌ 不推荐：直接操作 ctx.element

```ts
// ❌ 不推荐：直接使用 ctx.element 的 API
ctx.element.innerHTML = '<div>内容</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` 已废弃，请使用 `ctx.render()` 替代。

### ✅ 推荐：使用 ctx.render()

```ts
// ✅ 渲染 React 组件
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('欢迎')}>
    <Button type="primary">点击</Button>
  </Card>
);

// ✅ 渲染 HTML 字符串
ctx.render('<div style="padding:16px;">' + ctx.t('内容') + '</div>');

// ✅ 渲染 DOM 节点
const div = document.createElement('div');
div.textContent = ctx.t('你好');
ctx.render(div);
```

## 特例：作为弹窗锚点

在需要以当前元素为锚点打开 Popover 时，可访问 `ctx.element?.__el` 获取原生 DOM 作为 `target`：

```ts
// ctx.viewer.popover 需要原生 DOM 作为 target
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>弹出内容</div>,
});
```

> 仅在此类「将当前容器作为锚点」的场景下使用 `__el`；其他情况请勿直接操作 DOM。

## 与 ctx.render 的关系

- `ctx.render(vnode)` 若无传入 `container`，默认渲染到 `ctx.element` 容器内
- 若同时无 `ctx.element` 且未传入 `container`，会抛出错误
- 可显式指定容器：`ctx.render(vnode, customContainer)`

## 注意事项

- `ctx.element` 仅作为 `ctx.render()` 的内部容器使用，不建议直接访问或修改其属性/方法
- 在无渲染容器的上下文中 `ctx.element` 为 `undefined`，调用 `ctx.render()` 前需确保容器可用或手动传入 `container`
- ElementProxy 的 `innerHTML`/`outerHTML` 虽经 DOMPurify 清洗，仍推荐使用 `ctx.render()` 统一管理渲染

## 相关

- [ctx.render](./render.md)：渲染内容到容器
- [ctx.view](./view.md)：当前视图控制器
- [ctx.modal](./modal.md)：模态框快捷 API
