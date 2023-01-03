# v0.8.1：NocoBase 的 Logging 系统

## `@nocobase/logger`

基于 Winston 实现，提供了便捷的创建 logger 实例的方法。

```ts
const logger = createLogger();
logger.info('Hello distributed log files!');

const { instance, middleware } = createAppLogger(); // 用于 @nocobase/server
app.logger = instance;
app.use(middleware);
```

## 新增的环境变量

logger 相关环境变量有：

- [LOGGER_TRANSPORT](/api/env#logger_transport)
- [DAILY_ROTATE_FILE_DIRNAME](/api/env#daily_rotate_file_dirname)

## Application 的 logger 配置

```ts
const app = new Application({
  logger: {
    async skip(ctx) {
      return false;
    },
    requestWhitelist: [],
    responseWhitelist: [],
    transports: ['console', 'dailyRotateFile'],
  },
})
```

更多配置项参考 [Winston 文档](https://github.com/winstonjs/winston#table-of-contents)

## app.logger & ctx.logger

ctx.logger 带有 reqId，整个 ctx 周期里都是一个 reqId

```ts
ctx.logger = app.logger.child({ reqId: ctx.reqId });
```

`app.logger` 和 `ctx.logger` 都是 Winston 实例，详细用法参考 [Winston 文档](https://github.com/winstonjs/winston#table-of-contents)


## 自定义 Transports

除了 Winston 的方式以外，NocoBase 还提供了一种更便捷的方式

```ts
import { Transports } from '@nocobase/logger';

Transports['custom'] = () => {
  return new winston.transports.Console();
};

const app = new Application({
  logger: {
    transports: ['custom'],
  },
})
```
