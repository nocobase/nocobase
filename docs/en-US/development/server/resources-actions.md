# Resources and Actions

In the web development world, you may have heard of the concept of RESTful, and NocoBase borrows this concept of resources to map various entities in the system, such as data in a database, a file in a file system or a service. However, NocoBase does not fully follow the RESTful conventions based on practical considerations, but rather extends the specifications from the [Google Cloud API Design Guide](https://cloud.google.com/apis/design) to fit more scenarios.

## Basic concepts

The same concept as resources in RESTful, which are externally available objects in the system that can be manipulated, such as data tables, files, and other custom objects.

Actions refer to reading and writing to resources, usually for accessing data, creating data, updating data, deleting data, etc. NocoBase implements access to resources by defining actions, the core of which is actually a Koa-compatible middleware function for handling requests.

### Automatic mapping of collections to resources

NocoBase automatically maps collections to resources by default, and also provides a server-side data interface. So by default, as long as a collection is defined using `db.collection()`, you can access the data resources of this collection via NocoBase HTTP API. The name of the automatically generated resource is the same as the collection name, for example, the collection defined by `db.collection({ name: 'users' })` has the corresponding resource name `users`.

Also, there are built-in common CRUD actions for these data resources, and built-in actions methods for associative data for relational data resources.

The default actions for a simple data resource:

* [`list`](/api/actions#list): Query the list of data in the collection
* [`get`](/api/actions#get): Query a single record in the collection
* [`create`](/api/actions#create): Create a single record to the collection
* [`update`](/api/actions#update): Update a single record on the collection
* [`destroy`](/api/actions#destroy): Delete a single record from the collection

In addition to simple CRUD actions, relational resources have default relational actions:

* [`add`](/api/actions#add): Add a association to the data
* [`remove`](/api/actions#remove): Removes an association from the data
* [`set`](/api/actions#set): Set the association to the data
* [`toggle`](/api/actions#toggle): Add or remove associations to data

For example, to define an article collection and synchronize it to the database.

```ts
app.db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' }
  ]
});

await app.db.sync();
```

All CRUD methods for the `posts` data resource can then be called directly via the HTTP API: ```bash

```bash
# create
curl -X POST -H "Content-Type: application/json" -d '{"title": "first"}' http://localhost:13000/api/posts:create
# list
curl http://localhost:13000/api/posts:list
# update
curl -X PUT -H "Content-Type: application/json" -d '{"title": "second"}' http://localhost:13000/api/posts:update
# destroy
curl -X DELETE http://localhost:13000/api/posts:destroy?filterByTk=1
```

### Customize Actions

It is also possible to extend specific resources with more actions when the default provided actions such as CRUD do not satisfy the business scenario. For example, additional processing of built-in actions, or the need to set default parameters.

Custom actions for specific resources, such as overriding the `create` action in the article collection.

```ts
// Equivalent to app.resourcer.registerActions()
// Register the create action method for article resources
app.actions({
  async ['posts:create'](ctx, next) {
    const postRepo = ctx.db.getRepository('posts');
    await postRepo.create({
      values: {
        ... . ctx.action.params.values,
        // restrict the current user to be the creator of the post
        userId: ctx.state.currentUserId
      }
    });

    await next();
  }
});
```

This adds a reasonable restriction in the business that users cannot create articles as other users.

Custom operations for all global resources, such as adding `export` action to all collections.

```ts
app.actions({
  // Add export method to all resources for exporting data
  async export(ctx, next) {
    const repo = ctx.db.getRepository(ctx.action.resource);
    const results = await repo.find({
      filter: ctx.action.params.filter
    });
    ctx.type = 'text/csv';
    // Splice to CSV format
    ctx.body = results
      .map(row => Object.keys(row)
        .reduce((arr, col) => [... . arr, row[col]], []).join(',')
      ).join('\n');

    next();
  }
});
```

The data in CSV format can then be exported as follows from the HTTP API.

```bash
curl http://localhost:13000/api/<any_table>:export
```

### Action parameters

Once the client's request reaches the server, the relevant request parameters are parsed by rule and placed on the request's `ctx.action.params` object. there are three main sources for Action parameters.

1. default parameters at the time of Action definition
2. carried by the client request
3. other middleware preprocessing

The parameters from these three parts are combined in this order and eventually passed into the action's execution function before being processed by the real action handler. This is also true in multiple middleware, where the parameters from the previous middleware are continued to be passed to the next middleware with `ctx`.

The parameters available for built-in actions can be found in the [@nocobase/actions](/api/actions) package. Except for custom actions, client requests mainly use these parameters, and custom actions can be extended with the required parameters according to business requirements.

Middleware preprocessing mainly uses the `ctx.action.mergeParams()` method and has different merge strategies depending on the parameter types, see also the [mergeParams()](/api/resourcer/action#mergeparams) method for details.

The default parameters of the built-in Action can only be executed with the `mergeParams()` method for each parameter's default policy when merging, in order to achieve the purpose of limiting certain operations on the server side. For example

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

The above defines the `create` action for the `posts` resource, where `whitelist` and `blacklist` are whitelisted and blacklisted respectively for the `values` parameter, i.e. only the `title` and `content` fields in the `values` parameter are allowed, and the ` createdAt` and `createdById` fields in the `values` parameter are disabled.

### Custom resources

Data-based resources are also divided into standalone resources and association resources.

* Standalone resources: `<collection>`
* Association resources: `<collection>. <association>`

```ts
// Equivalent to app.resourcer.define()

// Define article resources
app.resource({
  name: 'posts'
});

// Define the article's author resource
app.resource({
  name: 'posts.user'
});

// Define the article's comment resource
app.resource({
  name: 'posts.coments'
});
```

The cases where customization is needed are mainly for non-database table-like resources, such as in-memory data, proxy interfaces for other services, etc., and for cases where specific actions need to be defined for existing table-like resources.

For example, to define a database-independent resource that sends a notification action.

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

Then it can be accessed in the HTTP API as follows

```bash
curl -X POST -d '{"title": "Hello", "to": "hello@nocobase.com"}' 'http://localhost:13000/api/notifications:send'
```

## Example

Let's continue the simple store scenario from the previous [Collections and fields example](/development/server/collections-fields#Example) to further understand the concepts related to resources and actions. It is assumed here that we base further resource and action definitions on the previous collection's example, so the definition of collection is not repeated here.

As long as the corresponding collections are defined, we can use default actions directly for data resources such as products, orders, etc. in order to complete the most basic CRUD scenarios.

### Overriding default actions


Sometimes, there are operations that are not simply for a single record, or the parameters of the default actions need to have some control, we can override the default actions. For example, when we create an order, instead of the client submitting `userId` to represent the ownership of the order, the server should determine the ownership of the order based on the currently logged-in user, so we can override the default `create` action. For simple extensions, we write directly in the main class of the plugin.

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

In this way, we override the default `create` action for order data resources during plugin loading, but the default logic is still called after modifying the action parameters, so there is no need to write it yourself. The `mergeParams()` method that modifies the submit parameters is useful for the built-in default actions, which we will describe later.

### Custom actions for collection resources

When the built-in actions do not meet the business needs, we can extend the functionality of the resource by customizing the actions. For example, usually an order will have many statuses, if we design the values of the `status` field as a series of enumerated values.

* `-1`: cancelled
* `0`: order placed, not paid
* `1`: Paid, not shipped
* `2`: shipped, not signed
* `3`: signed, order completed

Then we can realize the change of order status through custom actions, such as a shipping action on the order. Although the simple case can be realized through the `update` action, if there are more complicated cases such as payment and signing, using only `update` will cause the problem of unclear semantics and confusing parameters, so we can realize it through custom actions.

First we add a definition of a shipping information collection, saved to `collections/deliveries.ts`.

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

Also extend the orders collection with an associated field for shipping information (`collections/orders.ts`).

```ts
export default {
  name: 'orders',
  fields: [
    // ... . other fields
    {
      type: 'hasOne',
      name: 'delivery'
    }
  ]
};
```

Then we add the corresponding action definition in the main class of the plugin: 

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
                ... . ctx.action.params.values,
                status: 0
              status: 0 }
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

The Repository uses the data repository class of collection, from which most of the data reading and writing actions are done, see the [Repository API](/api/database/repository) section for details.

Once defined, we can call the "ship" action from the client via the HTTP API: 

```bash
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"provider": "SF", "trackingNumber": "SF1234567890"}' \
  '/api/orders:deliver/<id>'
```

Similarly, we can define more similar actions, such as payment, signup, etc.

### Parameter merging

Suppose we want to allow users to query their own and only their own orders, and we need to restrict them from querying cancelled orders, then we can define with the default parameters of the action.

```ts
import { Plugin } from '@nocobase/server';

export default class ShopPlugin extends Plugin {
  async load() {
    // ...
    this.app.resource({
      name: 'orders',
      actions: {
        // default parameters for list actions
        list: {
          filter: {
            // Filter operator extended by the users plugin
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

When the user queries from the client, additional parameters can also be added to the requested URL, such as

```bash
curl 'http://localhost:13000/api/orders:list?productId=1&fields=id,status,quantity,totalPrice&appends=product'
```

The actual query criteria will be combined as

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

and get the expected query results.

Alternatively, if we need to restrict the interface for creating orders to fields such as order number (`id`), total price (`totalPrice`), etc. that cannot be submitted by the client, this can be controlled by defining default parameters for the `create` action as follows

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

This way, even if the client intentionally submits these fields, they will be filtered out and will not exist in the `ctx.action.params` parameter set.

If there are more complex restrictions, such as only being able to place an order if the item is on the shelf and in stock, this can be achieved by configuring the middleware to

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

Putting some of the business logic (especially the preprocessing) into middleware makes our code clearer and easier to maintain.

## Summary

With the above example we have described how to define resources and related actions. To review this chapter.

* Automatic mapping of collections to resources
* Built-in default resource actions
* Custom actions on resources
* Parameter merging order and strategy for operations

The code covered in this chapter is included in a complete sample package [packages/samples/shop-actions](https://github.com/nocobase/nocobase/tree/main/packages/samples/shop-actions ), which can be run directly locally to see the results.
