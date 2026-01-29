# ctx.off()

取消通过 `ctx.on(eventName, handler)` 注册的事件监听器。

> 常与 `ctx.on` 配合使用，用于清理订阅，避免内存泄漏或重复触发。

## 类型定义（简化）

```ts
off(eventName: string, handler: (...args: any[]) => void): void;
```

## 使用示例

```ts
const handler = (ev) => {
  console.log('value changed', ev?.detail);
};

ctx.on('js-field:value-change', handler);

// 在适当时机取消监听
ctx.off('js-field:value-change', handler);
```
