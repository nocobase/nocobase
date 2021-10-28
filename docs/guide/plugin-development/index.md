---
order: 1
toc: menu
group:
  title: Plugin Development
  path: /guide/plugin-development
  order: 5
---

# What is a Plugin?

插件是按功能划分的可插拔的独立模块。

## Why Write Plugins?

NocoBase 提供了丰富的 API 用于应用开发，即使不写插件也是可以实现功能扩展。之所以写成插件，是为了降低耦合，以及更好的复用。做到一处编写，随处使用。当然有些业务联系非常紧密，也没有必要过分的插件化拆分。

## How to Write a Plugin?

例如，添加一个 ratelimit 中间件，可以这样写：

```ts
import ratelimit from 'koa-ratelimit';

app.use(ratelimit({
  driver: 'memory',
  db: new Map(),
  duration: 60000,
  errorMessage: 'Sometimes You Just Have to Slow Down.',
  id: (ctx) => ctx.ip,
  headers: {
    remaining: 'Rate-Limit-Remaining',
    reset: 'Rate-Limit-Reset',
    total: 'Rate-Limit-Total'
  },
  max: 100,
  disableHeader: false,
  whitelist: (ctx) => {
    // some logic that returns a boolean
  },
  blacklist: (ctx) => {
    // some logic that returns a boolean
  }
}));
```

但是这种写法，只能开发处理，不能动态移除。为此，NocoBase 提供了可插拔的 `app.plugin()` 接口，用于实现中间件的添加和移除。改造之后，代码如下：

```ts
import ratelimit from 'koa-ratelimit';

class RateLimitPlugin extends Plugin {
  constructor(options) {
    super(options);
    this.ratelimit = ratelimit(options.options);
  }

  enable() {
    this.app.use(this.ratelimit)
  }

  disable() {
    this.app.unuse(this.ratelimit);
  }
}

app.plugin(RateLimitPlugin, {
  name: 'rate-limit',
  version: '1.0.0',
  options: {
    driver: 'memory',
    db: new Map(),
    duration: 60000,
    errorMessage: 'Sometimes You Just Have to Slow Down.',
    id: (ctx) => ctx.ip,
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total'
    },
    max: 100,
    disableHeader: false,
    whitelist: (ctx) => {
      // some logic that returns a boolean
    },
    blacklist: (ctx) => {
      // some logic that returns a boolean
    }
  }
});
```

- 将 ratelimit 的参数提炼出来，更进一步可以把参数配置交给插件管理面板
- 当插件激活时，执行 plugin.enable()，把 ratelimit 添加进来
- 当插件禁用时，执行 plugin.disable()，把 ratelimit 移除

以上就是插件的核心内容了，任何功能扩展都可以这样处理。只要两步：

- 实现插件的 enable 接口，用于添加功能；
- 再实现 disable 接口，用于移除功能模块。

```ts
class MyPlugin extends Plugin {
  enable() {
    // 添加的逻辑
  }

  disable() {
    // 移除的逻辑
  }
}
```

**不实现 disable 可不可以？**

disable 接口是为了实现插件的热插拔，应用不需要重启就能实现插件的激活和禁用。如果某个插件不需要被禁用，也可以只实现 enable 接口。
