# Logger 日志

NocoBase 提供了一个基于 [pino](https://github.com/pinojs/pino) 的高性能日志系统。在任意拥有 `context` 的地方，都可以通过 `ctx.logger` 获取日志实例，用于记录插件或系统运行时的关键日志。

## 基本用法

```ts
// 记录致命错误（例如：初始化失败）
ctx.logger.fatal('应用初始化失败', { error });

// 记录一般错误（例如：接口请求出错）
ctx.logger.error('数据加载失败', { status, message });

// 记录警告信息（例如：性能风险或用户操作异常）
ctx.logger.warn('当前表单包含未保存的更改');

// 记录一般运行信息（例如：组件加载完成）
ctx.logger.info('用户资料组件加载完成');

// 记录调试信息（例如：状态变化）
ctx.logger.debug('当前用户状态', { user });

// 记录详细跟踪信息（例如：渲染流程）
ctx.logger.trace('组件渲染完成', { component: 'UserProfile' });
```

这些方法对应不同的日志级别（从高到低）：

| 级别 | 方法 | 说明 |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | 致命错误，通常导致程序退出 |
| `error` | `ctx.logger.error()` | 错误日志，表示请求或操作失败 |
| `warn` | `ctx.logger.warn()` | 警告信息，提示潜在风险或非预期情况 |
| `info` | `ctx.logger.info()` | 常规运行信息 |
| `debug` | `ctx.logger.debug()` | 调试信息，用于开发环境 |
| `trace` | `ctx.logger.trace()` | 详细跟踪信息，通常用于深度诊断 |

## 日志格式

每条日志输出均为结构化 JSON 格式，默认包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `level` | number | 日志级别 |
| `time` | number | 时间戳（毫秒） |
| `pid` | number | 进程 ID |
| `hostname` | string | 主机名 |
| `msg` | string | 日志消息 |
| 其他 | object | 自定义上下文信息 |

示例输出：

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## 上下文绑定

`ctx.logger` 会自动注入上下文信息，例如当前插件、模块或请求来源，使日志能更准确地追踪来源。

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

输出示例（带上下文）：

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## 自定义日志

你可以在插件中创建自定义的 logger 实例，继承或扩展默认配置：

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

子 logger 会继承主 logger 的配置并自动附加上下文。

## 日志级别划分

Pino 的日志级别遵循从高到低的数值定义，数值越小，优先级越低。  
以下是完整的日志级别划分表：

| 等级名称 | 数值 | 方法名 | 说明 |
|-----------|--------|----------|------|
| `fatal` | 60 | `logger.fatal()` | 致命错误，通常导致程序无法继续运行 |
| `error` | 50 | `logger.error()` | 一般错误，表示请求失败或操作异常 |
| `warn` | 40 | `logger.warn()` | 警告信息，提示潜在风险或非预期情况 |
| `info` | 30 | `logger.info()` | 普通信息，记录系统状态或正常操作 |
| `debug` | 20 | `logger.debug()` | 调试信息，用于开发阶段分析问题 |
| `trace` | 10 | `logger.trace()` | 详细跟踪信息，用于深入诊断 |
| `silent` | -Infinity | （无对应方法） | 关闭所有日志输出 |

Pino 只会输出大于或等于当前 `level` 配置的日志。例如，当日志级别为 `info` 时，`debug` 和 `trace` 的日志将被忽略。

## 在插件开发中的最佳实践

1. **使用上下文日志**  
   在插件、模型或应用上下文中使用 `ctx.logger`，可自动携带来源信息。

2. **区分日志级别**  
   - 使用 `error` 记录业务异常  
   - 使用 `info` 记录状态变化  
   - 使用 `debug` 记录开发调试信息  

3. **避免过量日志**  
   尤其在 `debug` 与 `trace` 级别下，建议仅在开发环境开启。

4. **使用结构化数据**  
   传入对象参数而非拼接字符串，有助于日志分析与过滤。

通过以上方式，开发者可以更高效地追踪插件执行过程、排查问题，并保持日志系统的结构化与可扩展性。
