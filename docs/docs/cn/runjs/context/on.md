# ctx.on()

在 RunJS 中订阅上下文事件（如字段值变化、属性变化、资源刷新等）。事件会根据类型映射到 `ctx.element` 上的自定义 DOM 事件或 `ctx.resource` 的内部事件总线。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSField / JSEditableField** | 监听字段值从外部（表单、联动等）变更时同步更新 UI，实现双向绑定 |
| **JSBlock / JSItem / JSColumn** | 监听容器上的自定义事件，响应数据或状态变化 |
| **resource 相关** | 监听资源刷新、保存等生命周期事件，在数据更新后执行逻辑 |

## 类型定义

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## 常见事件

| 事件名 | 说明 | 事件来源 |
|--------|------|----------|
| `js-field:value-change` | 字段值被外部修改（如表单联动、默认值更新） | `ctx.element` 上的 CustomEvent，`ev.detail` 为新值 |
| `resource:refresh` | 资源数据已刷新 | `ctx.resource` 事件总线 |
| `resource:saved` | 资源保存完成 | `ctx.resource` 事件总线 |

> 事件最终映射规则：以 `resource:` 为前缀的走 `ctx.resource.on`，其余通常走 `ctx.element` 上的 DOM 事件（若存在）。

## 示例

### 字段双向绑定（React useEffect + 清理）

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### 原生 DOM 监听（ctx.on 不可用时的替代）

```ts
// 当 ctx.on 未提供时，可直接使用 ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// 清理时：ctx.element?.removeEventListener('js-field:value-change', handler);
```

### 资源刷新后更新 UI

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // 根据 data 更新渲染
});
```

## 与 ctx.off 的配合

- 使用 `ctx.on` 注册的监听，应在适当时机通过 [ctx.off](./off.md) 移除，避免内存泄漏或重复触发。
- 在 React 中，通常在 `useEffect` 的 cleanup 函数中调用 `ctx.off`。
- `ctx.off` 可能不存在，使用时建议加可选链：`ctx.off?.('eventName', handler)`。

## 注意事项

1. **配对取消**：每次 `ctx.on(eventName, handler)` 都应有对应的 `ctx.off(eventName, handler)`，且传入的 `handler` 引用必须一致。
2. **生命周期**：在组件卸载或 context 销毁前移除监听，否则可能导致内存泄漏。
3. **事件可用性**：不同 context 类型支持的事件不同，具体以各组件文档为准。

## 相关文档

- [ctx.off](./off.md) - 移除事件监听
- [ctx.element](./element.md) - 渲染容器与 DOM 事件
- [ctx.resource](./resource.md) - 资源实例及其 `on`/`off`
- [ctx.setValue](./set-value.md) - 设置字段值（会触发 `js-field:value-change`）
