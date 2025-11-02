# Logger

NocoBase logging is based on <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. By default, NocoBase divides logs into API request logs, system runtime logs, and SQL execution logs. API request logs and SQL execution logs are printed internally by the application. Plugin developers usually only need to print plugin-related system runtime logs.

This document explains how to create and print logs during plugin development.

## Default Printing Methods

NocoBase provides system runtime log printing methods. Logs are printed according to specified fields and output to specified files.

```ts
// Default printing method
app.log.info("message");

// Use in middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Use in plugins
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

All of the above methods follow the usage below:

The first parameter is the log message, and the second parameter is an optional metadata object, which can be any key-value pairs. where `module`, `submodule`, and `method` will be extracted as separate fields, and the remaining fields will be placed in the `meta` field.

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

If you want to use the system default printing method but don't want to output to the default file, you can create a custom system logger instance using `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Whether to output error level logs separately to 'xxx_error.log'
});
```

## Custom Logger

If you want to use Winston's native methods instead of the system-provided ones, you can create logs using the following methods.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` extends the original `winston.LoggerOptions`.

- `transports` - Use `'console' | 'file' | 'dailyRotateFile'` to apply preset output methods.
- `format` - Use `'logfmt' | 'json' | 'delimiter'` to apply preset printing formats.

### `app.createLogger`

In multi-app scenarios, sometimes we want custom output directories and files, which can be output to a directory named after the current application.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Output to /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

The use case and method are the same as `app.createLogger`.

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

