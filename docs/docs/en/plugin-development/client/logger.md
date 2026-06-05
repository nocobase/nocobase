# Logger

NocoBase provides a high-performance logging system based on [pino](https://github.com/pinojs/pino). Anywhere you have access to `context`, you can get a logger instance through `ctx.logger` to record key logs during plugin or system runtime.

## Basic Usage

```ts
// Log fatal errors (e.g., initialization failure)
ctx.logger.fatal('Application initialization failed', { error });

// Log general errors (e.g., API request errors)
ctx.logger.error('Data loading failed', { status, message });

// Log warnings (e.g., performance risks or user operation exceptions)
ctx.logger.warn('Current form contains unsaved changes');

// Log general runtime information (e.g., component loaded)
ctx.logger.info('User profile component loaded');

// Log debug information (e.g., state changes)
ctx.logger.debug('Current user state', { user });

// Log detailed trace information (e.g., rendering flow)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

These methods correspond to different log levels (from high to low):

| Level   | Method              | Description |
| ------- | ------------------- | ----------- |
| `fatal` | `ctx.logger.fatal()` | Fatal errors, usually causing program exit |
| `error` | `ctx.logger.error()` | Error logs, indicating request or operation failure |
| `warn`  | `ctx.logger.warn()`  | Warning information, alerting potential risks or unexpected situations |
| `info`  | `ctx.logger.info()`  | Regular runtime information |
| `debug` | `ctx.logger.debug()` | Debug information for development environment |
| `trace` | `ctx.logger.trace()` | Detailed trace information, usually for deep diagnosis |

## Log Format

Each log output is in structured JSON format, containing the following fields by default:

| Field     | Type   | Description |
| --------- | ------ | ----------- |
| `level`   | number | Log level   |
| `time`    | number | Timestamp (milliseconds) |
| `pid`     | number | Process ID  |
| `hostname` | string | Hostname    |
| `msg`     | string | Log message |
| Others    | object | Custom context information |

Example output:

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

## Context Binding

`ctx.logger` automatically injects context information, such as the current plugin, module, or request source, making logs more accurately traceable to their source.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Example output (with context):

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Custom Logger

You can create custom logger instances in plugins, inheriting or extending default configurations:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Child loggers inherit the main logger's configuration and automatically attach context.

## Log Level Hierarchy

Pino's log levels follow a numeric definition from high to low, where smaller numbers indicate lower priority.  
Below is the complete log level hierarchy:

| Level Name | Value | Method Name | Description |
| ---------- | ----- | ----------- | ----------- |
| `fatal`    | 60    | `logger.fatal()` | Fatal errors, usually causing the program to be unable to continue running |
| `error`    | 50    | `logger.error()` | General errors, indicating request failure or operation exceptions |
| `warn`     | 40    | `logger.warn()` | Warning information, alerting potential risks or unexpected situations |
| `info`     | 30    | `logger.info()` | General information, recording system status or normal operations |
| `debug`    | 20    | `logger.debug()` | Debug information for development stage problem analysis |
| `trace`    | 10    | `logger.trace()` | Detailed trace information for in-depth diagnosis |
| `silent`   | -Infinity | (no corresponding method) | Turn off all log output |

Pino only outputs logs greater than or equal to the current `level` configuration. For example, when the log level is `info`, `debug` and `trace` logs will be ignored.

## Best Practices in Plugin Development

1. **Use the Context Logger**  
   Use `ctx.logger` in plugin, model, or application contexts to automatically carry source information.

2. **Distinguish Log Levels**  
   - Use `error` to record business exceptions  
   - Use `info` to record status changes  
   - Use `debug` to record development debugging information  

3. **Avoid Excessive Logging**  
   Especially at `debug` and `trace` levels, it's recommended to only enable them in development environments.

4. **Use Structured Data**  
   Pass object parameters instead of concatenating strings, which helps with log analysis and filtering.

By following these practices, developers can more efficiently track plugin execution, troubleshoot issues, and maintain a structured and extensible logging system.

