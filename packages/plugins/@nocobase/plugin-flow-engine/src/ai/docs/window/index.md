# window

安全的 `window` 对象代理，提供受限的全局 API 访问。

## 说明

在 RunJS 执行环境中，`window` 是一个安全的代理对象，仅允许访问特定的全局 API。`window.console` 代理到 `ctx.logger`。

## 可用的 API

- **定时器**：`setTimeout`、`clearTimeout`、`setInterval`、`clearInterval`
- **console**：`window.console`（代理到 `ctx.logger`）
- **Math**：数学函数
- **Date**：日期构造函数
- **FormData**：表单数据构造函数
- **addEventListener**：事件监听
- **open**：安全的 `window.open` 代理（仅允许 http/https/about:blank）
- **location**：安全的 location 代理（只读部分属性，支持安全的导航）

## 使用示例

```ts
// 使用定时器
const timer = window.setTimeout(() => {
  console.log('定时器触发');
}, 1000);

// 使用 console（代理到 ctx.logger）
window.console.log('通过 window.console 记录');
window.console.error('错误信息');

// 使用 Math
const result = window.Math.max(1, 2, 3);

// 使用 Date
const now = new window.Date();

// 安全的 window.open
window.open('https://example.com', '_blank');

// 安全的 location 访问
const origin = window.location.origin;
window.location.href = '/new-page'; // 安全导航
```

## 注意事项

- `window.console` 代理到 `ctx.logger`，等同于使用 `console` 或 `ctx.logger`
- 访问未声明的属性会抛出错误
- `window.open` 仅允许 http/https/about:blank 协议
- `location` 对象是只读代理，仅暴露安全的属性和方法
