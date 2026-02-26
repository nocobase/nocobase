# ctx.logger

Logging built on [pino](https://github.com/pinojs/pino); outputs structured JSON. Prefer `ctx.logger` over `console` for collection and analysis.

## Use Cases

Available in all RunJS contexts for debugging, error tracking, and performance.

## Type

```ts
logger: pino.Logger;
```

`ctx.logger` is `engine.logger.child({ module: 'flow-engine' })`, i.e. a pino child logger with a `module` context.

## Log levels

From highest to lowest:

| Level | Method | Description |
|-------|--------|-------------|
| `fatal` | `ctx.logger.fatal()` | Fatal; usually process exit |
| `error` | `ctx.logger.error()` | Error; request or operation failed |
| `warn` | `ctx.logger.warn()` | Warning; potential issue |
| `info` | `ctx.logger.info()` | General runtime info |
| `debug` | `ctx.logger.debug()` | Debug; development |
| `trace` | `ctx.logger.trace()` | Verbose; deep diagnosis |

## Recommended usage

Use `level(msg, meta)`: message first, optional metadata object second.

```ts
ctx.logger.info('Block loaded');
ctx.logger.info('Success', { recordId: 456 });
ctx.logger.warn('Slow', { duration: 5000 });
ctx.logger.error('Failed', { userId: 123, action: 'create' });
ctx.logger.error('Request failed', { err });
```

pino also supports `level(meta, msg)` or `level({ msg, ...meta })` if needed.

## Examples

### Basic

```ts
ctx.logger.info('Block loaded');
ctx.logger.warn('Request failed, using cache', { err });
ctx.logger.debug('Saving', { recordId: ctx.record?.id });
```

### Child logger

```ts
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Step 1');
log.debug('Step 2', { step: 2 });
```

### vs console

Prefer `ctx.logger` for structured JSON. Rough mapping: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Output format

pino outputs JSON with:

- `level`: numeric level
- `time`: timestamp (ms)
- `msg`: message
- `module`: `flow-engine`
- Any custom fields passed in the object

## Notes

- Logs are JSON for easy collection and querying
- Child loggers from `child()` also work well with `level(msg, meta)`
- Some environments (e.g. workflow) may use different log handling

## Related

- [pino](https://github.com/pinojs/pino)
