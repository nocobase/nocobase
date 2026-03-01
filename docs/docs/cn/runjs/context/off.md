# ctx.off()

移除通过 `ctx.on(eventName, handler)` 注册的事件监听。常与 [ctx.on](./on.md) 配合使用，在适当时机取消订阅，避免内存泄漏或重复触发。

## 适用场景

| 场景 | 说明 |
|------|------|
| **React useEffect 清理** | 在 `useEffect` 的 cleanup 中调用，组件卸载时移除监听 |
| **JSField / JSEditableField** | 字段双向绑定时，取消对 `js-field:value-change` 的订阅 |
| **resource 相关** | 取消对 `ctx.resource.on` 注册的 refresh、saved 等监听 |

## 类型定义

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## 示例

### React useEffect 中配对使用

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### 资源事件取消订阅

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// 适当时机
ctx.resource?.off('refresh', handler);
```

## 注意事项

1. **handler 引用一致**：`ctx.off` 时传入的 `handler` 必须与 `ctx.on` 时是同一引用，否则无法正确移除。
2. **及时清理**：在组件卸载或 context 销毁前调用 `ctx.off`，避免内存泄漏。

## 相关文档

- [ctx.on](./on.md) - 订阅事件
- [ctx.resource](./resource.md) - 资源实例及其 `on`/`off`
