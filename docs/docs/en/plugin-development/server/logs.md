# Logger

NocoBase logger is a wrapper around <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. By default, NocoBase divides logs into API request logs, system operation logs, and SQL execution logs. The API request logs and SQL execution logs are printed internally by the application. Plugin developers usually only need to print system operation logs related to their plugins.

This document mainly introduces how to create and print logs when developing plugins. For more information about logging, please refer to: [Logger Plugin](../../handbook/logger/index.md).

## Default Logging Method

NocoBase provides a method for printing system operation logs. The logs are printed according to specified fields and output to a designated file. Reference: [Logger Plugin - System Logs](../../handbook/logger/index.md#system-logs).

```ts
// Default logging method
app.log.info("message");

// Use in middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Use in a plugin
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

All the above methods follow the usage below:

The first parameter is the log message, and the second is an optional metadata object, which can be any key-value pair. Among them, `module`, `submodule`, and `method` will be extracted as separate fields, while the remaining fields will be placed in the `meta` field.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Output to Other Files

If you want to use the system's default logging method but do not want to output to the default file, you can use `createSystemLogger` to create a custom system logger instance.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Whether to output error-level logs to 'xxx_error.log' separately
});
```

## Custom Logger

If you do not want to use the system-provided logging method and prefer to use Winston's native methods, you can create a logger using the following methods.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` is an extension of the original `winston.LoggerOptions`.

- `transports` - You can use `'console' | 'file' | 'dailyRotateFile'` to apply preset output methods.
- `format` - You can use `'logfmt' | 'json' | 'delimiter'` to apply preset printing formats.

### `app.createLogger`

In a multi-app scenario, sometimes we want the custom output directory and file to be under the directory named after the current application. Reference: [Logger Plugin - Log Directory](../../handbook/logger/index.md#log-directory).

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Output to /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

The use case and usage are the same as `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Output to /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```