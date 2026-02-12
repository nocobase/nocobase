# ctx.logger

A logging wrapper based on [pino](https://github.com/pinojs/pino).

## Type definition

```typescript
logger: pino.Logger
```

## Notes

`ctx.logger` is a pino Logger instance and provides high-performance structured logging. In RunJS, `console` and `window.console` are proxied to `ctx.logger`, so `console.log()` or `console.error()` actually call the corresponding `ctx.logger` methods.

## Log levels

pino supports the following levels (high to low):

| Level   | Method                 | Description |
|--------|----------------------|------------------------------|
| `fatal` | `ctx.logger.fatal()` | Fatal error, typically causes process exit |
| `error` | `ctx.logger.error()` | Error log, request or operation failed |
| `warn`  | `ctx.logger.warn()`  | Warning, potential risk or abnormal state |
| `info`  | `ctx.logger.info()`  | General runtime info |
| `debug` | `ctx.logger.debug()` | Debug info for development |
| `trace` | `ctx.logger.trace()` | Detailed tracing for diagnostics |

## Examples

### Directly using ctx.logger

**ctx.logger supports flexible argument ordering**:

```ts
// Style 1: object first, message second (pino native)
ctx.logger.error({ userId: 123, action: 'create' }, 'Operation failed');
ctx.logger.warn({ duration: 5000 }, 'Performance warning');
ctx.logger.info({ recordId: 456 }, 'Operation succeeded');

// Style 2: message first, object second (also supported)
ctx.logger.error('Operation failed', { userId: 123, action: 'create' });
ctx.logger.warn('Performance warning', { duration: 5000 });
ctx.logger.info('Operation succeeded', { recordId: 456 });

// Style 3: everything in one object
ctx.logger.error({ msg: 'Operation failed', userId: 123, action: 'create' });
ctx.logger.warn({ msg: 'Performance warning', duration: 5000 });
ctx.logger.info({ msg: 'Operation succeeded', recordId: 456 });
```

### Using console (proxied to ctx.logger)

```ts
// console.log/info/warn/error are proxied to ctx.logger
console.log('This is a log');
console.info('Info log');
console.warn('Warning log');
console.error('Error log');

// window.console is also proxied
window.console.log('Log via window.console');
```

## Log format

pino outputs structured JSON logs. Each log includes:

- `level`: log level (number)
- `time`: timestamp (ms)
- `msg`: message
- Custom fields passed via objects

## Notes

- **Flexible argument order**: object first, message first, or single object
- `console` and `window.console` are proxied to `ctx.logger`
- `console.log()` equals `ctx.logger.info()`
- `console.error()` equals `ctx.logger.error()`
- `console.warn()` equals `ctx.logger.warn()`
- Logs are structured JSON for collection and analysis
- Child loggers created via `child()` also support flexible arguments
