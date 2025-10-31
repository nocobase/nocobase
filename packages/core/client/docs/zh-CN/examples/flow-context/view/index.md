# ctx.view

:::info
`ctx.view` 由 `FlowViewContext` 提供，只能在通过 `ctx.viewer` 打开的视图的上下文中获取。
:::

`ctx.view` 表示**当前激活的视图实例**，用于操作当前弹窗、抽屉或嵌入式视图等。它提供了 Header、Footer、close 等常用 API，便于在内容组件中灵活控制视图行为。

## 支持的视图类型

- `dialog`（对话框/模态框）
- `drawer`（抽屉）
- `popover`（气泡弹层）
- `embed`（嵌入式区域）

## 常用属性和方法

- `Header`：用于渲染视图的头部区域
- `Footer`：用于渲染视图的底部区域
- `close()`：关闭当前视图
- `update()`：更新属性

### 打开一个对话框

```tsx | pure
<Button
  onClick={() => {
    this.context.viewer.open({
      type: 'dialog',
      content: () => <DialogContent />,
    });
  }}
>
  Open dialog
</Button>
```

### 在内容组件中使用 ctx.view

仅在 `content` 的组件树内才可以获取到 `ctx.view`，如：

```tsx | pure
function DialogContent() {
  const ctx = useFlowContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title={`Dialog Header - #${ctx.model.uid}`} />
      <div>This is a view opened from the flow context.</div>
      <Footer>
        <Button onClick={close}>Close</Button>
      </Footer>
    </div>
  );
}
```

### useFlowView()

如果只想获取当前的 ctx.view，也可以通过 `useFlowView()` Hook 获取。  
这个 Hook 直接返回当前激活视图的实例对象，适合在内容组件中只关心视图操作时使用，无需手动获取整个 ctx。

```tsx | pure
function DialogContent() {
  const view = useFlowView();
  const { Header, Footer } = view;
  return (
    <div>
      <Header title={`Dialog Header - #${ctx.model.uid}`} />
      <div>This is a view opened from the flow context.</div>
      <Footer>
        <Button onClick={() => view.close()}>Close</Button>
      </Footer>
    </div>
  );
}
```

## 注意事项

- 目前仅 dialog 和 drawer 支持 Header 和 Footer。

## 示例

### useFlowView

<code src="./dialog-hook.tsx"></code>

### 参数传递

<code src="./input-args.tsx"></code>

### 将 FlowViewContext 提供给其他 model 代理

<code src="./model.tsx"></code>

重要步骤说明：

1. **提供纯粹的 FlowViewContext**

添加 `inheritContext: false`，保证上层的 FlowContext 不继承给 FlowViewContext。

```ts
viewer.dialog({
  inheritContext: false,
  content: () => <TestModelRenderer />,
});
```

2. **通过 delegate 指定继承的 context**

将 FlowViewContext 传递给即将初始化的 TestModel

```ts
engine.createModel({ use: TestModel }, { delegate: ctx });
```

如果只是想快速的在组件内拿到当前 FlowViewContext，可以通过 `useFlowViewContext()` 获取。
和 delegate 方式的区别在于 delegate context 可以在整个 Model 树内共享。
