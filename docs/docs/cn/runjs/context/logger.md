# ctx.logger

基于 [pino](https://github.com/pinojs/pino) 的日志封装。

## 类型定义

```typescript
logger: pino.Logger
```

## 说明

`ctx.logger` 是 pino Logger 实例，提供高性能结构化日志。在 RunJS 中，`console` 和 `window.console` 会被代理到 `ctx.logger`，因此调用 `console.log()` 或 `console.error()` 实际会调用对应的 `ctx.logger` 方法。

## 日志级别

pino 支持以下级别（从高到低）：

| 级别   | 方法                 | 说明                         |
|--------|----------------------|------------------------------|
| `fatal` | `ctx.logger.fatal()` | 致命错误，通常导致进程退出   |
| `error` | `ctx.logger.error()` | 错误日志，表示请求或操作失败 |
| `warn`  | `ctx.logger.warn()`  | 警告，表示潜在风险或异常情况 |
| `info`  | `ctx.logger.info()`  | 一般运行时信息               |
| `debug` | `ctx.logger.debug()` | 调试信息，用于开发           |
| `trace` | `ctx.logger.trace()` | 详细追踪，用于深度诊断       |

## 示例

### 直接使用 ctx.logger

**ctx.logger 支持灵活的参数顺序**（会自动处理）：

```ts
// ✅ 方式 1：对象在前，消息在后（pino 原生）
ctx.logger.error({ userId: 123, action: 'create' }, '操作失败');
ctx.logger.warn({ duration: 5000 }, '性能警告');
ctx.logger.info({ recordId: 456 }, '操作成功');

// ✅ 方式 2：消息在前，对象在后（同样支持）
ctx.logger.error('操作失败', { userId: 123, action: 'create' });
ctx.logger.warn('性能警告', { duration: 5000 });
ctx.logger.info('操作成功', { recordId: 456 });

// ✅ 方式 3：全部放在一个对象中
ctx.logger.error({ msg: '操作失败', userId: 123, action: 'create' });
ctx.logger.warn({ msg: '性能警告', duration: 5000 });
ctx.logger.info({ msg: '操作成功', recordId: 456 });
```

### 使用 console（代理到 ctx.logger）

```ts
// console.log/info/warn/error 会代理到 ctx.logger
console.log('这是一条日志');
console.info('信息日志');
console.warn('警告日志');
console.error('错误日志');

// window.console 也会代理到 ctx.logger
window.console.log('通过 window.console 输出');
```

## 日志格式

pino 输出结构化 JSON 日志。每条日志包含：

- `level`：日志级别（数字）
- `time`：时间戳（毫秒）
- `msg`：日志消息
- 其他自定义字段（通过对象传入）

## 注意

- **灵活参数顺序**：`ctx.logger` 会自动处理参数顺序，支持对象在前、消息在前或单对象形式
- RunJS 中 `console` 和 `window.console` 会代理到 `ctx.logger`
- `console.log()` 等价于 `ctx.logger.info()`
- `console.error()` 等价于 `ctx.logger.error()`
- `console.warn()` 等价于 `ctx.logger.warn()`
- 日志为结构化 JSON，便于采集和分析
- 通过 `child()` 创建的子 logger 同样支持灵活参数顺序
