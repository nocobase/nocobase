# Logger 日志

NocoBase 日志基于 <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a> 封装。默认情况下，NocoBase 将日志分为接口请求日志、系统运行日志和 SQL 执行日志，其中接口请求日志和 SQL 执行日志由应用内部打印，插件开发者通常只需要打印插件相关的系统运行日志。

本文档主要介绍在开发插件的时候，如何创建和打印日志。

## 默认打印方法

NocoBase 提供了系统运行日志的打印方法，日志按照规定字段打印，同时输出到指定文件。

```ts
// 默认打印方法
app.log.info("message");

// 在中间件中使用
async function (ctx, next) {
  ctx.log.info("message");
}

// 在插件中使用
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

以上方法都遵循下面的用法：

第一个参数为日志消息，第二个参数为可选 metadata 对象，可以是任意键值对，其中 `module`, `submodule`, `method` 会被提取为单独字段，其余字段则放到 `meta` 字段中。

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

## 输出到其他文件

如果想沿用系统默认的打印方法，但是不想输出到默认的文件中，可以使用 `createSystemLogger` 创建一个自定义的系统日志实例。

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // 是否将 error 级别日志单独输出到 'xxx_error.log'
});
```

## 自定义日志

如果不想使用系统提供的打印方法，想使用 Winston 原生的方法，可以通过以下方法创建日志。

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

`options` 在原来 `winston.LoggerOptions` 的基础上进行了扩展。

- `transports` - 可以使用 `'console' | 'file' | 'dailyRotateFile'` 应用预置的输出方式。
- `format` - 可以使用 `'logfmt' | 'json' | 'delimiter'` 应用预置的打印格式。

### `app.createLogger`

在多应用的场景下，有时候我们希望自定义的输出目录和文件，可以输出到当前应用名称的目录下。

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // 输出到 /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

使用场景和用法同 `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // 输出到 /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```
