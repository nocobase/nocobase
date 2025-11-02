# Logger

NocoBase logger is a wrapper around <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. By default, NocoBase categorizes logs into API request logs, system logs, and SQL execution logs. The API request and SQL execution logs are printed by the application itself, so plugin developers typically only need to print system logs related to their plugins.

This document primarily introduces how to create and print logs when developing plugins.

## Default Printing Method

NocoBase provides a method for printing system logs. The logs are printed with predefined fields and output to a specified file.

```ts
// Default printing method
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

If you want to use the system's default printing method but output to a different file, you can use `createSystemLogger` to create a custom system logger instance.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Whether to output error-level logs separately to 'xxx_error.log'
});
```

## Custom Logger

If you do not want to use the system-provided printing method and prefer to use Winston's native methods, you can create a logger using the following methods.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

The `options` extend the original `winston.LoggerOptions`.

- `transports` - You can use `'console' | 'file' | 'dailyRotateFile'` to apply preset output methods.
- `format` - You can use `'logfmt' | 'json' | 'delimiter'` to apply preset printing formats.

### `app.createLogger`

In a multi-app scenario, you might want your custom output directory and file to be located under the directory of the current application's name.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Outputs to /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

The use case and usage are the same as `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Outputs to /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```