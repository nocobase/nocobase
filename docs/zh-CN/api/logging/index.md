# Logging

## 概览

Nocobase 的 Logging 系统基于 [Winston](https://github.com/winstonjs/winston) 实现，内置于 `application` 实例中。

```javascript
const { Application } = require('@nocobase/server');


// 指定 Application 的 basePath，将会在 `${basePath}/storage/logs` 下创建日志文件
const app = new Application({
  basePath: __dirname,
});

// 在 middleware 中使用
app.use(async (ctx, next) => {
  ctx.logger.info('handle http request');
  await next();
});

app.logger.info('hello world');
```


## 包导出方法

### createLogger(options)

创建 Logger 实例

```javascript
const { createLogger } = require('@nocobase/logging');
const logger = createLogger();

logger.info('hello world');
```