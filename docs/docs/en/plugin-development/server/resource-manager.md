# ResourceManager

NocoBase's resource management feature can automatically convert existing collections and associations into resources, with built-in operation types to help developers quickly build REST API resource operations. Different from traditional REST APIs, NocoBase resource operations don't rely on HTTP request methods, but determine the specific operation to execute through explicit `:action` definitions.

## Auto-generating Resources

NocoBase automatically converts `collection` and `association` defined in the database into resources. For example, defining two collections, `posts` and `tags`:

```ts
db.defineCollection({
  name: 'posts',
  fields: [
    { type: 'belongsToMany', name: 'tags' },
  ],
});

db.defineCollection({
  name: 'tags',
  fields: [],
});
```

This will automatically generate the following resources:

*   `posts` resource
*   `tags` resource
*   `posts.tags` association resource

Request examples:

| Method | Path                   | Operation      |
| ------ | ---------------------- | -------------- |
| `GET`  | `/api/posts:list`      | Query list     |
| `GET`  | `/api/posts:get/1`     | Query single   |
| `POST` | `/api/posts:create`    | Add new        |
| `POST` | `/api/posts:update/1`  | Update         |
| `POST` | `/api/posts:destroy/1` | Delete         |

| Method | Path                   | Operation      |
| ------ | ---------------------- | -------------- |
| `GET`  | `/api/tags:list`       | Query list     |
| `GET`  | `/api/tags:get/1`      | Query single   |
| `POST` | `/api/tags:create`     | Add new        |
| `POST` | `/api/tags:update/1`   | Update         |
| `POST` | `/api/tags:destroy/1`  | Delete         |

| Method | Path                           | Operation                            |
| ------ | ------------------------------ | ------------------------------------ |
| `GET`  | `/api/posts/1/tags:list`       | Query all `tags` associated with a `post` |
| `GET`  | `/api/posts/1/tags:get/1`      | Query a single `tag` under a `post`   |
| `POST` | `/api/posts/1/tags:create`     | Create a single `tag` under a `post`  |
| `POST` | `/api/posts/1/tags:update/1`   | Update a single `tag` under a `post`  |
| `POST` | `/api/posts/1/tags:destroy/1`  | Delete a single `tag` under a `post`  |
| `POST` | `/api/posts/1/tags:add`        | Add associated `tags` to a `post`     |
| `POST` | `/api/posts/1/tags:remove`     | Remove associated `tags` from a `post` |
| `POST` | `/api/posts/1/tags:set`        | Set all associated `tags` for a `post` |
| `POST` | `/api/posts/1/tags:toggle`     | Toggle `tags` association for a `post` |

:::tip Tip

NocoBase resource operations don't directly depend on request methods, but determine operations through explicit `:action` definitions.

:::

## Resource Operations

NocoBase provides rich built-in operation types to meet various business needs.

### Basic CRUD Operations

| Operation Name   | Description                             | Applicable Resource Types | Request Method | Example Path                |
| ---------------- | --------------------------------------- | ------------------------- | -------------- | --------------------------- |
| `list`           | Query list data                         | All                       | GET/POST       | `/api/posts:list`           |
| `get`            | Query single data                       | All                       | GET/POST       | `/api/posts:get/1`          |
| `create`         | Create new record                       | All                       | POST           | `/api/posts:create`         |
| `update`         | Update record                           | All                       | POST           | `/api/posts:update/1`       |
| `destroy`        | Delete record                           | All                       | POST           | `/api/posts:destroy/1`      |
| `firstOrCreate`  | Find first record, create if not exists | All                       | POST           | `/api/users:firstOrCreate`  |
| `updateOrCreate` | Update record, create if not exists     | All                       | POST           | `/api/users:updateOrCreate` |

### Relationship Operations

| Operation Name | Description               | Applicable Relationship Types                     | Example Path                   |
| -------------- | ------------------------- | ------------------------------------------------- | ------------------------------ |
| `add`          | Add association           | `hasMany`, `belongsToMany`                        | `/api/posts/1/tags:add`        |
| `remove`       | Remove association        | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set`          | Reset association         | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set`    |
| `toggle`       | Add or remove association | `belongsToMany`                                   | `/api/posts/1/tags:toggle`     |

### Operation Parameters

Common operation parameters include:

*   `filter`: Query conditions
*   `values`: Values to set
*   `fields`: Specify returned fields
*   `appends`: Include associated data
*   `except`: Exclude fields
*   `sort`: Sorting rules
*   `page`, `pageSize`: Pagination parameters
*   `paginate`: Whether to enable pagination
*   `tree`: Whether to return tree structure
*   `whitelist`, `blacklist`: Field whitelist/blacklist
*   `updateAssociationValues`: Whether to update association values

---

## Custom Resource Operations

NocoBase allows registering additional operations for existing resources. You can use `registerActionHandlers` to customize operations for all or specific resources.

### Register Global Operations

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Register Resource-Specific Operations

```ts
resourceManager.registerActionHandlers({
  'posts:publish': async (ctx) => publishPost(ctx),
  'posts.comments:pin': async (ctx) => pinComment(ctx),
});
```

Request examples:

```
POST /api/posts:customAction
POST /api/posts:publish
POST /api/posts/1/comments:pin
```

Naming rule: `resourceName:actionName`, use dot syntax (`posts.comments`) when including associations.

## Custom Resources

If you need to provide resources unrelated to collections, you can use the `resourceManager.define` method to define them:

```ts
resourceManager.define({
  name: 'app',
  actions: {
    getInfo: async (ctx) => {
      ctx.body = { version: 'v1' };
    },
  },
});
```

Request methods are consistent with auto-generated resources:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (supports both GET/POST by default)

## Custom Middleware

Use the `resourceManager.use()` method to register global middleware. For example:

Global logging middleware

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Special Context Properties

Being able to enter the `resourceManager` layer's middleware or action means the resource must exist.

### ctx.action

*   `ctx.action.actionName`: Operation name
*   `ctx.action.resourceName`: Can be a collection or association
*   `ctx.action.params`: Operation parameters

### ctx.dataSource

The current data source object.

### ctx.getCurrentRepository()

The current repository object.

## How to Get resourceManager Objects for Different Data Sources

`resourceManager` belongs to a data source, and operations can be registered separately for different data sources.

### Main Data Source

For the main data source, you can directly use `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Other Data Sources

For other data sources, you can get a specific data source instance through `dataSourceManager` and use that instance's `resourceManager`:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterate All Data Sources

If you need to perform the same operations on all added data sources, you can use the `dataSourceManager.afterAddDataSource` method to iterate, ensuring each data source's `resourceManager` can register the corresponding operations:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```