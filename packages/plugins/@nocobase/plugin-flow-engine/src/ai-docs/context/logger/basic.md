# Basic

## Log Lifecycle

Use this snippet to log lifecycle.

```ts
ctx.logger.info('step started');
```

## Log Error

Use this snippet to log error.

```ts
ctx.logger.error(error.message, { stack: error.stack });
```
