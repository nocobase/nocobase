---
order: 1
toc: menu
group:
  title: Plugin Development
  path: /guide/plugin-development
  order: 5
---

# What is a Plugin?

Plugins are pluggable, standalone modules divided by function.

## Why Write Plugins?

NocoBase provides a rich API for application development and can be extended even without writing plugins. The reason for writing plugins is to reduce coupling and better reuse. To do a place to write, use anywhere. Of course, some business links are very close, there is no need to overly plug-in split.

## How to Write a Plugin?

For example, to add a ratelimit middleware, you can write it like this.

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

But with this kind of writing, it can only be handled by development, not dynamically removed. For this reason, NocoBase provides a pluggable `app.plugin()` interface for adding and removing middleware. After the modification, the code is as follows.

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

- Distilling the parameters of ratelimit goes a step further by giving the parameter configuration to the plugin management panel
- When the plugin is active, execute plugin.enable() to add ratelimit to it
- When the plugin is disabled, execute plugin.disable() to remove ratelimit

The above is the core content of the plugin, any functional extension can be handled in this way. Just two steps.

- Implement the enable interface of the plugin for adding functionality.
- Then implement the disable interface for removing the function module.

```ts
class MyPlugin extends Plugin {
  enable() {
    // Logic for adding
  }

  disable() {
    // Logic to remove
  }
}
```

**Is it possible not to implement disable? **

The disable interface is designed to enable hot-plugging of plugins so that applications can activate and disable plugins without rebooting. If a plugin does not need to be disabled, you can also just implement the enable interface.
