# ctx.logger

基于 [pino](https://github.com/pinojs/pino) 的日志封装，提供高性能结构化 JSON 日志。推荐使用 `ctx.logger` 代替 `console` 以便于日志采集与分析。

## 适用场景

所有 RunJS 场景均可使用 `ctx.logger`，用于调试、错误追踪、性能分析等。

## 类型定义

```ts
logger: pino.Logger;
```

`ctx.logger` 为 `engine.logger.child({ module: 'flow-engine' })`，即带 `module` 上下文的 pino 子 logger。

## 日志级别

pino 支持以下级别（从高到低）：

| 级别 | 方法 | 说明 |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | 致命错误，通常导致进程退出 |
| `error` | `ctx.logger.error()` | 错误，表示请求或操作失败 |
| `warn` | `ctx.logger.warn()` | 警告，表示潜在风险或异常情况 |
| `info` | `ctx.logger.info()` | 一般运行时信息 |
| `debug` | `ctx.logger.debug()` | 调试信息，用于开发 |
| `trace` | `ctx.logger.trace()` | 详细追踪，用于深度诊断 |

## 推荐写法

推荐使用 `level(msg, meta)` 形式：消息在前，可选元数据对象在后。

```ts
ctx.logger.info('区块加载完成');
ctx.logger.info('操作成功', { recordId: 456 });
ctx.logger.warn('性能警告', { duration: 5000 });
ctx.logger.error('操作失败', { userId: 123, action: 'create' });
ctx.logger.error('请求失败', { err });
```

pino 也支持 `level(meta, msg)`（对象在前）或 `level({ msg, ...meta })`（单对象），可按需使用。

## 示例

### 基本用法

```ts
ctx.logger.info('区块加载完成');
ctx.logger.warn('请求失败，使用缓存', { err });
ctx.logger.debug('正在保存', { recordId: ctx.record?.id });
```

### 使用 child() 创建子 logger

```ts
// 为当前逻辑创建带上下文的子 logger
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('执行步骤 1');
log.debug('执行步骤 2', { step: 2 });
```

### 与 console 的关系

推荐直接使用 `ctx.logger` 以获得结构化 JSON 日志。若习惯使用 `console`，可对应：`console.log` → `ctx.logger.info`，`console.error` → `ctx.logger.error`，`console.warn` → `ctx.logger.warn`。

## 日志格式

pino 输出结构化 JSON，每条日志包含：

- `level`：日志级别（数字）
- `time`：时间戳（毫秒）
- `msg`：日志消息
- `module`：固定为 `flow-engine`
- 其他自定义字段（通过对象传入）

## 注意事项

- 日志为结构化 JSON，便于采集、检索与分析
- 通过 `child()` 创建的子 logger 同样推荐 `level(msg, meta)` 写法
- 部分运行环境（如工作流）可能使用不同的日志输出方式

## 相关

- [pino](https://github.com/pinojs/pino) — 底层日志库
