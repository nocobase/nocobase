# ctx.on()

在 RunJS 环境中订阅上下文事件（如字段值变更、属性变更、资源刷新等）。

> 事件最终会映射到 `ctx.element` 的自定义事件或内部事件总线，具体事件名可参考各组件文档。

## 类型定义（简化）

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## 常见事件示例

- `js-field:value-change`：自定义字段值变化
- `resource:refresh`：资源刷新

## 使用示例

```ts
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```
