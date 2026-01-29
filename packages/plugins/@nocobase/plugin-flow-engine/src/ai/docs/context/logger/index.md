# ctx.logger

Logger wrapper based on [pino](https://github.com/pinojs/pino).

## Type Definition

```typescript
logger: pino.Logger
```

## Notes

`ctx.logger` is a pino Logger instance that provides high-performance structured logging. In RunJS, `console` and `window.console` are proxied to `ctx.logger`, so calling `console.log()` or `console.error()` actually calls the corresponding `ctx.logger` methods.

## Log Levels

pino supports the following levels (highest to lowest):

| Level | Method | Notes |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Fatal error, usually causes the process to exit |
| `error` | `ctx.logger.error()` | Error logs, indicates a request or operation failed |
| `warn` | `ctx.logger.warn()` | Warning, indicates potential risk or unexpected conditions |
| `info` | `ctx.logger.info()` | General runtime information |
| `debug` | `ctx.logger.debug()` | Debug information, for development |
| `trace` | `ctx.logger.trace()` | Detailed tracing, for deep diagnostics |

## Examples

### Use ctx.logger directly

**ctx.logger supports flexible parameter order** (handled automatically):

```ts
// ✅ Option 1: object first, message second (pino native)
ctx.logger.error({ userId: 123, action: 'create' }, 'Operation failed');
ctx.logger.warn({ duration: 5000 }, 'Performance warning');
ctx.logger.info({ recordId: 456 }, 'Operation succeeded');

// ✅ Option 2: message first, object second (also supported)
ctx.logger.error('Operation failed', { userId: 123, action: 'create' });
ctx.logger.warn('Performance warning', { duration: 5000 });
ctx.logger.info('Operation succeeded', { recordId: 456 });

// ✅ Option 3: everything in a single object
ctx.logger.error({ msg: 'Operation failed', userId: 123, action: 'create' });
ctx.logger.warn({ msg: 'Performance warning', duration: 5000 });
ctx.logger.info({ msg: 'Operation succeeded', recordId: 456 });
```

### Use console (proxied to ctx.logger)

```ts
// console.log/info/warn/error are proxied to ctx.logger
console.log('This is a log');
console.info('Info log');
console.warn('Warning log');
console.error('Error log');

// window.console is also proxied to ctx.logger
window.console.log('Logged via window.console');
```

## Log Format

pino outputs structured JSON logs. Each log contains:
- `level`: log level (number)
- `time`: timestamp (milliseconds)
- `msg`: log message
- Other custom fields (passed as an object)

## Notes

- **Flexible parameter order**: `ctx.logger` automatically handles parameter order and supports:
  - ✅ `ctx.logger.error({ userId: 123 }, 'Operation failed')` - object first
  - ✅ `ctx.logger.error('Operation failed', { userId: 123 })` - message first (auto-converted)
  - ✅ `ctx.logger.error({ msg: 'Operation failed', userId: 123 })` - single object
- `console` and `window.console` are proxied to `ctx.logger` in RunJS
- `console.log()` is equivalent to `ctx.logger.info()`
- `console.error()` is equivalent to `ctx.logger.error()`
- `console.warn()` is equivalent to `ctx.logger.warn()`
- Logs are structured JSON, suitable for collection and analysis
- Child loggers created via `child()` also support flexible parameter order
