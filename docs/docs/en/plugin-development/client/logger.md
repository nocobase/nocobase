# Logger

NocoBase provides a high-performance logging system based on [pino](https://github.com/pinojs/pino). Wherever a `context` is available, you can access the logger instance via `ctx.logger` to record critical logs for your plugin or the system's runtime.

## Basic Usage

```ts
// Log a fatal error (e.g., initialization failure)
ctx.logger.fatal('Application initialization failed', { error });

// Log a general error (e.g., API request failed)
ctx.logger.error('Data loading failed', { status, message });

// Log a warning (e.g., performance risk or abnormal user action)
ctx.logger.warn('The current form contains unsaved changes');

// Log general runtime information (e.g., component loaded successfully)
ctx.logger.info('User profile component loaded successfully');

// Log debug information (e.g., state change)
ctx.logger.debug('Current user state', { user });

// Log detailed trace information (e.g., rendering flow)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

These methods correspond to different log levels (from highest to lowest):

| Level | Method | Description |
|---|---|---|
| `fatal` | `ctx.logger.fatal()` | Fatal error, usually causes the program to exit. |
| `error` | `ctx.logger.error()` | Error log, indicates a failed request or operation. |
| `warn` | `ctx.logger.warn()` | Warning message, indicates potential risks or unexpected situations. |
| `info` | `ctx.logger.info()` | General runtime information. |
| `debug` | `ctx.logger.debug()` | Debug information, used in development environments. |
| `trace` | `ctx.logger.trace()` | Detailed trace information, typically for in-depth diagnostics. |

## Log Format

Each log entry is output in a structured JSON format and includes the following fields by default:

| Field | Type | Description |
|---|---|---|
| `level` | number | Log level |
| `time` | number | Timestamp (in milliseconds) |
| `pid` | number | Process ID |
| `hostname` | string | Hostname |
| `msg` | string | Log message |
| Others | object | Custom context information |

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

`ctx.logger` automatically injects contextual information, such as the current plugin, module, or request source, allowing logs to be traced back to their origin more accurately.

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

## Custom Logs

You can create custom logger instances in your plugin that inherit or extend the default configuration:

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Child loggers inherit the configuration of the parent logger and automatically attach context.

## Log Level Division

Pino's log levels follow a numerical definition from highest to lowest. The smaller the number, the lower the priority.
Here is the complete table of log levels:

| Level Name | Value | Method Name | Description |
|---|---|---|---|
| `fatal` | 60 | `logger.fatal()` | Fatal error, usually prevents the program from continuing to run. |
| `error` | 50 | `logger.error()` | General error, indicates a failed request or abnormal operation. |
| `warn` | 40 | `logger.warn()` | Warning message, indicates potential risks or unexpected situations. |
| `info` | 30 | `logger.info()` | General information, records system status or normal operations. |
| `debug` | 20 | `logger.debug()` | Debug information, for analyzing issues during development. |
| `trace` | 10 | `logger.trace()` | Detailed trace information, for in-depth diagnostics. |
| `silent` | -Infinity | (No corresponding method) | Disables all log output. |

Pino only outputs logs with a level greater than or equal to the current `level` configuration. For example, if the log level is set to `info`, `debug` and `trace` logs will be ignored.

## Best Practices in Plugin Development

1.  **Use Contextual Logging**
    Use `ctx.logger` within plugin, model, or application contexts to automatically include source information.

2.  **Differentiate Log Levels**
    -   Use `error` to record business exceptions.
    -   Use `info` to record state changes.
    -   Use `debug` for development and debugging information.

3.  **Avoid Excessive Logging**
    It is recommended to enable `debug` and `trace` levels only in development environments.

4.  **Use Structured Data**
    Pass object parameters instead of concatenating strings. This facilitates log analysis and filtering.

By following these practices, developers can more efficiently trace plugin execution, troubleshoot issues, and maintain a structured and extensible logging system.