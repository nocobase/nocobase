# ctx.on()

在 RunJS 中订阅上下文事件（如字段值变化、属性变化、资源刷新）。

> 事件最终会映射到 `ctx.element` 上的自定义事件或内部事件总线。具体事件名请参考相关组件文档。

## 类型定义（简化）

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## 常见事件示例

- `js-field:value-change`：自定义字段值变化
- `resource:refresh`：资源刷新

## 示例

```ts
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```
