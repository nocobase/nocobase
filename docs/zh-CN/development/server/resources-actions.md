# 资源与操作

在 Web 开发领域，你可能听说过 RESTful 的概念，NocoBase 也借用了这个资源的概念来映射系统中的各种实体，比如数据库中的数据、文件系统中的文件或某个服务等。但 NocoBase 基于实践考虑，并未完全遵循 RESTful 的约定，而是参考 [Google Cloud API 设计指南](https://cloud.google.com/apis/design) 的规范做了一些扩展，以适应更多的场景。

## 基础概念

与 RESTful 中资源的概念相同，是系统中对外提供的可操作的对象，可以是数据表、文件、和其他自定义的对象。

操作主要指对资源的读取和写入，通常用于查阅数据、创建数据、更新数据、删除数据等。NocoBase 通过定义操作来实现对资源的访问，操作的核心其实是一个用于处理请求且兼容 Koa 的中间件函数。

### 数据表自动映射为资源

目前的资源主要针对数据表中的数据，NocoBase 在默认情况下都会将数据库中的数据表自动映射为资源，同时也提供了服务端的数据接口。所以在默认情况下，只要使用了 `db.collection()` 定义了数据表，就可以通过 NocoBase 的 HTTP API 访问到这个数据表的数据资源了。自动生成的资源的名称与数据表定义的表名相同，比如 `db.collection({ name: 'users' })` 定义的数据表，对应的资源名称就是 `users`。

同时，还为这些数据资源内置了常用的 CRUD 操作，关系型数据资源也内置了关联数据的操作方法。

简单数据资源的默认操作：

* [`list`](/api/actions#list)：查询数据表中的数据列表
* [`get`](/api/actions#get)：查询数据表中的单条数据
* [`create`](/api/actions#create)：对数据表创建单条数据
* [`update`](/api/actions#update)：对数据表更新单条数据
* [`destroy`](/api/actions#destroy)：对数据表删除单条数据

关系资源除了简单的 CRUD 操作，还有默认的关系操作：

* [`add`](/api/actions#add)：对数据添加关联
* [`remove`](/api/actions#remove)：对数据移除关联
* [`set`](/api/actions#set)：对数据设置关联
* [`toggle`](/api/actions#toggle)：对数据添加或移除关联

比如定义一个文章数据表并同步到数据库：

```ts
app.db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' }
  ]
});

await app.db.sync();
```

之后针对 `posts` 数据资源的所有 CRUD 方法就可以直接通过 HTTP API 被调用了：

```bash
# create
curl -X POST -H "Content-Type: application/json" -d '{"title":"first"}' http://localhost:13000/api/posts:create
# list
curl http://localhost:13000/api/posts:list
# update
curl -X PUT -H "Content-Type: application/json" -d '{"title":"second"}' http://localhost:13000/api/posts:update
# destroy
curl -X DELETE http://localhost:13000/api/posts:destroy?filterByTk=1
```

### 自定义 Action

当默认提供的 CRUD 等操作不满足业务场景的情况下，也可以对特定资源扩展更多的操作。比如是对内置操作的额外处理，或者需要设置默认参数。

针对特定资源的自定义操作，如覆盖文章表里的`创建`操作：

```ts
// 等同于 app.resourcer.registerActions()
// 注册针对文章资源的 create 操作方法
app.actions({
  async ['posts:create'](ctx, next) {
    const postRepo = ctx.db.getRepository('posts');
    await postRepo.create({
      values: {
        ...ctx.action.params.values,
        // 限定当前用户是文章的创建者
        userId: ctx.state.currentUserId
      }
    });

    await next();
  }
});
```

这样在业务中就增加了合理的限制，用户不能以其他用户身份创建文章。

针对全局所有资源的自定义操作，如对所有数据表都增加`导出`的操作：

```ts
app.actions({
  // 对所有资源都增加了 export 方法，用于导出数据
  async export(ctx, next) {
    const repo = ctx.db.getRepository(ctx.action.resource);
    const results = await repo.find({
      filter: ctx.action.params.filter
    });
    ctx.type = 'text/csv';
    // 拼接为 CSV 格式
    ctx.body = results
      .map(row => Object.keys(row)
        .reduce((arr, col) => [...arr, row[col]], []).join(',')
      ).join('\n');

    next();
  }
});
```

然后可以按以下 HTTP API 的方式导出 CSV 格式的数据：

```bash
curl http://localhost:13000/api/<any_table>:export
```

### Action 参数

客户端的请求到达服务端后，相关的请求参数会被按规则解析并放在请求的 `ctx.action.params` 对象上。Action 参数主要有三个来源：

1. Action 定义时默认参数
2. 客户端请求携带
3. 其他中间件预处理

在真正操作处理函数处理之前，上面这三个部分的参数会按此顺序被合并到一起，最终传入操作的执行函数中。在多个中间件中也是如此，上一个中间件处理完的参数会被继续随 `ctx` 传递到下一个中间件中。

针对内置的操作可使用的参数，可以参考 [@nocobase/actions](/api/actions) 包的内容。除自定义操作以外，客户端请求主要使用这些参数，自定义的操作可以根据业务需求扩展需要的参数。

中间件预处理主要使用 `ctx.action.mergeParams()` 方法，且根据不同的参数类型有不同的合并策略，具体也可以参考 [mergeParams()](/api/resourcer/action#mergeparams) 方法的内容。

内置 Action 的默认参数在合并时只能以 `mergeParams()` 方法针对各个参数的默认策略执行，以达到服务端进行一定操作限制的目的。例如：

```ts
app.resource({
  name: 'posts',
  actions: {
    create: {
      whitelist: ['title', 'content'],
      blacklist: ['createdAt', 'createdById'],
    }
  }
});
```

如上定义了针对 `posts` 资源的 `create` 操作，其中 `whitelist` 和 `blacklist` 分别是针对 `values` 参数的白名单和黑名单，即只允许 `values` 参数中的 `title` 和 `content` 字段，且禁止 `values` 参数中的 `createdAt` 和 `createdById` 字段。

### 自定义资源

数据型的资源还分为独立资源和关系资源：

* 独立资源：`<collection>`
* 关系资源：`<collection>.<association>`

```ts
// 等同于 app.resourcer.define()

// 定义文章资源
app.resource({
  name: 'posts'
});

// 定义文章的作者资源
app.resource({
  name: 'posts.user'
});

// 定义文章的评论资源
app.resource({
  name: 'posts.coments'
});
```

需要自定义的情况主要针对于非数据库表类资源，比如内存中的数据、其他服务的代理接口等，以及需要对已有数据表类资源定义特定操作的情况。

例如定义一个与数据库无关的发送通知操作的资源：

```ts
app.resource({
  name: 'notifications',
  actions: {
    async send(ctx, next) {
      await someProvider.send(ctx.request.body);
      next();
    }
  }
});
```

则在 HTTP API 中可以这样访问：

```bash
curl -X POST -d '{"title": "Hello", "to": "hello@nocobase.com"}' 'http://localhost:13000/api/notifications:send'
```

## 示例

我们继续之前 [数据表与字段示例](/development/server/collections-fields#示例) 中的简单店铺场景，进一步理解资源与操作相关的概念。这里假设我们基于之前数据表的示例进行进一步资源和操作的定义，所以这里不再重复定义数据表的内容。

只要定义了对应的数据表，我们对商品、订单等数据资源就可以直接使用默认操作以完成最基础的 CRUD 场景。

### 覆盖默认操作

有时候，不只是简单的针对单条数据的操作，或者默认操作的参数需要有一定控制，我们就可以覆盖默认的操作。比如我们创建订单时，不应该由客户端提交 `userId` 来代表订单的归属，而是应该由服务端根据当前登录用户来确定订单归属，这时我们就可以覆盖默认的 `create` 操作。对于简单的扩展，我们直接在插件的主类中编写：

```ts
import { Plugin } from '@nocobase/server';
import actions from '@nocobase/actions';

export default class ShopPlugin extends Plugin {
  async load() {
    // ...
    this.app.resource({
      name: 'orders',
      actions: {
        async create(ctx, next) {
          ctx.action.mergeParams({
            values: {
              userId: ctx.state.user.id
            }
          });
    
          return actions.create(ctx, next);
        }
      }
    });
  }
}
```

这样，我们在插件加载过程中针对订单数据资源就覆盖了默认的 `create` 操作，但在修改操作参数以后仍调用了默认逻辑，无需自行编写。修改提交参数的 `mergeParams()` 方法对内置默认操作来说非常有用，我们会在后面介绍。

### 数据表资源的自定义操作

当内置操作不能满足业务需求时，我们可以通过自定义操作来扩展资源的功能。例如通常一个订单会有很多状态，如果我们对 `status` 字段的取值设计为一系列枚举值：

* `-1`：已取消
* `0`：已下单，未付款
* `1`：已付款，未发货
* `2`：已发货，未签收
* `3`：已签收，订单完成

那么我们就可以通过自定义操作来实现订单状态的变更，比如对订单进行一个发货的操作，虽然简单的情况下可以通过 `update` 操作来实现，但是如果还有支付、签收等更复杂的情况，仅使用 `update` 会造成语义不清晰且参数混乱的问题，因此我们可以通过自定义操作来实现。

首先我们增加一张发货信息表的定义，保存到 `collections/deliveries.ts`：

```ts
export default {
  name: 'deliveries',
  fields: [
    {
      type: 'belongsTo',
      name: 'order'
    },
    {
      type: 'string',
      name: 'provider'
    },
    {
      type: 'string',
      name: 'trackingNumber'
    },
    {
      type: 'integer',
      name: 'status'
    }
  ]
};
```

同时对订单表也扩展一个发货信息的关联字段（`collections/orders.ts`）：

```ts
export default {
  name: 'orders',
  fields: [
    // ...other fields
    {
      type: 'hasOne',
      name: 'delivery'
    }
  ]
};
```

然后我们在插件的主类中增加对应的操作定义：

```ts
import { Plugin } from '@nocobase/server';

export default class ShopPlugin extends Plugin {
  async load() {
    // ...
    this.app.resource({
      name: 'orders',
      actions: {
        async deliver(ctx, next) {
          const { filterByTk } = ctx.action.params;
          const orderRepo = ctx.db.getRepository('orders');

          const [order] = await orderRepo.update({
            filterByTk,
            values: {
              status: 2,
              delivery: {
                ...ctx.action.params.values,
                status: 0
              }
            }
          });

          ctx.body = order;

          next();
        }
      }
    });
  }
}
```

其中，Repository 是使用数据表数据仓库类，大部分进行数据读写的操作都会由此完成，详细可以参考 [Repository API](/api/database/repository) 部分。

定义好之后我们从客户端就可以通过 HTTP API 来调用“发货”这个操作了：

```bash
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"provider": "SF", "trackingNumber": "SF1234567890"}' \
  '/api/orders:deliver/<id>'
```

同样的，我们还可以定义更多类似的操作，比如支付、签收等。

### 参数合并

假设我们要让用户可以查询自己的且只能查询自己的订单，同时我们需要限制用户不能查询已取消的订单，那么我们可以通过 action 的默认参数来定义：

```ts
import { Plugin } from '@nocobase/server';

export default class ShopPlugin extends Plugin {
  async load() {
    // ...
    this.app.resource({
      name: 'orders',
      actions: {
        // list 操作的默认参数
        list: {
          filter: {
            // 由 users 插件扩展的过滤器运算符
            $isCurrentUser: true,
            status: {
              $ne: -1
            }
          },
          fields: ['id', 'status', 'createdAt', 'updatedAt']
        }
      }
    });
  }
}
```

当用户从客户端查询时，也可以在请求的 URL 上加入其他的参数，比如：

```bash
curl 'http://localhost:13000/api/orders:list?productId=1&fields=id,status,quantity,totalPrice&appends=product'
```

实际的查询条件会合并为：

```json
{
  "filter": {
    "$and": {
      "$isCurrentUser": true,
      "status": {
        "$ne": -1
      },
      "productId": 1
    }
  },
  "fields": ["id", "status", "quantity", "totalPrice", "createdAt", "updatedAt"],
  "appends": ["product"]
}
```

并得到预期的查询结果。

另外，如果我们需要对创建订单的接口限制不能由客户端提交订单编号（`id`）、总价（`totalPrice`）等字段，可以通过对 `create` 操作定义默认参数控制：

```ts
import { Plugin } from '@nocobase/server';

export default class ShopPlugin extends Plugin {
  async load() {
    // ...
    this.app.resource({
      name: 'orders',
      actions: {
        create: {
          blacklist: ['id', 'totalPrice', 'status', 'createdAt', 'updatedAt'],
          values: {
            status: 0
          }
        }
      }
    });
  }
}
```

这样即使客户端故意提交了这些字段，也会被过滤掉，不会存在于 `ctx.action.params` 参数集中。

如果还要有更复杂的限制，比如只能在商品上架且有库存的情况下才能下单，可以通过配置中间件来实现：

```ts
import { Plugin } from '@nocobase/server';

export default class ShopPlugin extends Plugin {
  async load() {
    // ...
    this.app.resource({
      name: 'orders',
      actions: {
        create: {
          middlewares: [
            async (ctx, next) => {
              const { productId } = ctx.action.params.values;

              const product = await ctx.db.getRepository('products').findOne({
                filterByTk: productId,
                filter: {
                  enabled: true,
                  inventory: {
                    $gt: 0
                  }
                }
              });

              if (!product) {
                return ctx.throw(404);
              }

              await next();
            }
          ]
        }
      }
    });
  }
}
```

把部分业务逻辑（尤其是前置处理）放到中间件中，可以让我们的代码更加清晰，也更容易维护。

## 小结

通过上面的示例我们介绍了如何定义资源和相关的操作，回顾一下本章内容：

* 数据表自动映射为资源
* 内置默认的资源操作
* 对资源自定义操作
* 操作的参数合并顺序与策略

本章所涉及到的相关代码放到了一个完整的示例包 [packages/samples/shop-actions](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-actions) 中，可以直接在本地运行，查看效果。
