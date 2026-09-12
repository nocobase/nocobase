# ctx.logger

A logging wrapper based on [pino](https://github.com/pinojs/pino), providing high-performance structured JSON logs. It is recommended to use `ctx.logger` instead of `console` for easier log collection and analysis.

## Scenarios

`ctx.logger` can be used in all RunJS scenarios for debugging, error tracking, performance analysis, etc.

## Type Definition

```ts
logger: pino.Logger;
```

`ctx.logger` is an instance of `engine.logger.child({ module: 'flow-engine' })`, which is a pino child logger with a `module` context.

## Log Levels

pino supports the following levels (from highest to lowest):

| Level | Method | Description |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Fatal error, usually leading to process exit |
| `error` | `ctx.logger.error()` | Error, indicating a failed request or operation |
| `warn` | `ctx.logger.warn()` | Warning, indicating potential risks or abnormal situations |
| `info` | `ctx.logger.info()` | General runtime information |
| `debug` | `ctx.logger.debug()` | Debugging information, used during development |
| `trace` | `ctx.logger.trace()` | Detailed trace, used for deep diagnostics |

## Recommended Usage

The recommended format is `level(msg, meta)`: the message comes first, followed by an optional metadata object.

```ts
ctx.logger.info('Block loading complete');
ctx.logger.info('Operation successful', { recordId: 456 });
ctx.logger.warn('Performance warning', { duration: 5000 });
ctx.logger.error('Operation failed', { userId: 123, action: 'create' });
ctx.logger.error('Request failed', { err });
```

pino also supports `level(meta, msg)` (object first) or `level({ msg, ...meta })` (single object), which can be used as needed.

## Examples

### Basic Usage

```ts
ctx.logger.info('Block loading complete');
ctx.logger.warn('Request failed, using cache', { err });
ctx.logger.debug('Saving...', { recordId: ctx.record?.id });
```

### Creating a Child Logger with child()

```ts
// Create a child logger with context for the current logic
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Executing step 1');
log.debug('Executing step 2', { step: 2 });
```

### Relationship with console

It is recommended to use `ctx.logger` directly to obtain structured JSON logs. If you are accustomed to using `console`, the mappings are: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Log Format

pino outputs structured JSON, where each log entry contains:

- `level`: Log level (numeric)
- `time`: Timestamp (milliseconds)
- `msg`: Log message
- `module`: Fixed as `flow-engine`
- Other custom fields (passed via objects)

## Notes

- Logs are structured JSON, making them easy to collect, search, and analyze.
- Child loggers created via `child()` also follow the `level(msg, meta)` recommendation.
- Some runtime environments (such as Workflows) may use different log output methods.

## Related

- [pino](https://github.com/pinojs/pino) — The underlying logging library