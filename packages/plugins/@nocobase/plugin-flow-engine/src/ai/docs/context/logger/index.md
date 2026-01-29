# ctx.logger

基于 [pino](https://github.com/pinojs/pino) 的日志记录器封装。

## 类型定义

```typescript
logger: pino.Logger
```

## 说明

`ctx.logger` 是 pino Logger 的实例，提供了高性能的结构化日志记录功能。在 RunJS 执行环境中，`console` 和 `window.console` 都代理到 `ctx.logger`，因此使用 `console.log()`、`console.error()` 等方法时，实际上会调用 `ctx.logger` 的对应方法。

## 日志级别

pino 支持以下日志级别（从高到低）：

| 级别 | 方法 | 说明 |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | 致命错误，通常导致程序退出 |
| `error` | `ctx.logger.error()` | 错误日志，表示请求或操作失败 |
| `warn` | `ctx.logger.warn()` | 警告信息，提示潜在风险或非预期情况 |
| `info` | `ctx.logger.info()` | 常规运行信息 |
| `debug` | `ctx.logger.debug()` | 调试信息，用于开发环境 |
| `trace` | `ctx.logger.trace()` | 详细跟踪信息，通常用于深度诊断 |

## 使用示例

### 直接使用 ctx.logger

**ctx.logger 支持灵活的参数顺序**（已自动处理）

```ts
// ✅ 方式1：对象在前，消息在后（pino 原生方式）
ctx.logger.error({ userId: 123, action: 'create' }, '操作失败');
ctx.logger.warn({ duration: 5000 }, '性能警告');
ctx.logger.info({ recordId: 456 }, '操作成功');

// ✅ 方式2：消息在前，对象在后（也支持）
ctx.logger.error('操作失败', { userId: 123, action: 'create' });
ctx.logger.warn('性能警告', { duration: 5000 });
ctx.logger.info('操作成功', { recordId: 456 });

// ✅ 方式3：所有内容都在一个对象中
ctx.logger.error({ msg: '操作失败', userId: 123, action: 'create' });
ctx.logger.warn({ msg: '性能警告', duration: 5000 });
ctx.logger.info({ msg: '操作成功', recordId: 456 });
```

### 使用 console（代理到 ctx.logger）

```ts
// console.log/info/warn/error 都会代理到 ctx.logger
console.log('这是一条日志');
console.info('信息日志');
console.warn('警告日志');
console.error('错误日志');

// window.console 同样代理到 ctx.logger
window.console.log('通过 window.console 记录');
```

## 日志格式

pino 输出结构化的 JSON 格式日志，每条日志包含：
- `level`: 日志级别（数字）
- `time`: 时间戳（毫秒）
- `msg`: 日志消息
- 其他自定义字段（作为对象传递）

## 注意事项

- **参数顺序灵活**：`ctx.logger` 已自动处理参数顺序，支持以下三种方式：
  - ✅ `ctx.logger.error({ userId: 123 }, '操作失败')` - 对象在前
  - ✅ `ctx.logger.error('操作失败', { userId: 123 })` - 消息在前（自动转换）
  - ✅ `ctx.logger.error({ msg: '操作失败', userId: 123 })` - 单对象形式
- `console` 和 `window.console` 在 RunJS 环境中都代理到 `ctx.logger`
- 使用 `console.log()` 等同于 `ctx.logger.info()`
- 使用 `console.error()` 等同于 `ctx.logger.error()`
- 使用 `console.warn()` 等同于 `ctx.logger.warn()`
- 日志输出为结构化 JSON 格式，便于日志收集和分析
- `child()` 方法创建的子 logger 也支持灵活的参数顺序
