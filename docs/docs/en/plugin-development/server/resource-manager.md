---
title: "ResourceManager"
description: "NocoBase server resource management: app.resourceManager, registerActions, resource.use, Action registration."
keywords: "ResourceManager,resource management,registerActions,resource.use,Action,NocoBase"
---

# ResourceManager

NocoBase's resource management automatically converts Collections and Associations into resources, with built-in operation types that allow you to quickly build REST APIs. Unlike traditional REST APIs, NocoBase resource operations don't directly depend on HTTP request methods, but determine the specific operation to execute through explicit `:action` definitions.

## Auto-generating Resources

NocoBase automatically converts Collections and Associations defined in the database into resources. For example, defining two collections, `posts` and `tags`:

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

* `posts` resource
* `tags` resource
* `posts.tags` association resource

Request examples:

| Method | Path                   | Operation      |
| ------ | ---------------------- | -------------- |
| `GET`  | `/api/posts:list`      | Query list     |
| `GET`  | `/api/posts:get/1`     | Query single   |
| `POST` | `/api/posts:create`    | Create         |
| `POST` | `/api/posts:update/1`  | Update         |
| `POST` | `/api/posts:destroy/1` | Delete         |

| Method | Path                   | Operation      |
| ------ | ---------------------- | -------------- |
| `GET`  | `/api/tags:list`       | Query list     |
| `GET`  | `/api/tags:get/1`      | Query single   |
| `POST` | `/api/tags:create`     | Create         |
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

NocoBase resource operations don't directly depend on HTTP request methods, but determine operations through explicit `:action` definitions.

:::

## Resource Operations

NocoBase provides built-in operation types covering common business scenarios.

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

* `filter`: Query conditions
* `values`: Values to set
* `fields`: Specify returned fields
* `appends`: Include associated data
* `except`: Exclude fields
* `sort`: Sorting rules
* `page`, `pageSize`: Pagination parameters
* `paginate`: Whether to enable pagination
* `tree`: Whether to return tree structure
* `whitelist`, `blacklist`: Field whitelist/blacklist
* `updateAssociationValues`: Whether to update association values

---

## Custom Resource Operations

You can use `registerActionHandlers` to register additional operations for existing resources, supporting both global and resource-specific operations.

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

If you need to provide resources unrelated to data tables, you can use `resourceManager.define` to define them:

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

* `GET /api/app:getInfo`
* `POST /api/app:getInfo` (supports both GET/POST by default)

## Custom Middleware

Use `resourceManager.use()` to register global middleware. For example, a global logging middleware:

```ts
resourceManager.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});
```

## Special Context Properties

Being able to enter the `resourceManager` layer's middleware or action means the resource must exist. You can access the request context through the following properties:

### ctx.action

* `ctx.action.actionName`: Operation name
* `ctx.action.resourceName`: Can be a Collection or Association
* `ctx.action.params`: Operation parameters

### ctx.dataSource

The current data source object.

### ctx.getCurrentRepository()

The current repository object.

## How to Get resourceManager Objects for Different Data Sources

`resourceManager` belongs to a data source, and you can register operations separately for different data sources.

### Main Data Source

For the main data source, you can directly use `app.resourceManager`:

```ts
app.resourceManager.registerActionHandlers();
```

### Other Data Sources

For other data sources, you can get the corresponding instance through `dataSourceManager`:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterate All Data Sources

If you need to perform the same operations on all data sources, you can use `dataSourceManager.afterAddDataSource` to iterate:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```

## Related Links

- [Resource API Reference](../../api/flow-engine/resource.md) — Full method signatures and usage for client-side MultiRecordResource / SingleRecordResource
- [ACL](./acl.md) — Configure role permissions and access control for resource operations
- [Context](./context.md) — Access context information in request handlers
- [Middleware](./middleware.md) — Add interception and processing logic for requests
- [DataSourceManager](./data-source-manager.md) — Manage multiple data sources and their resource managers
- [Collections](./collections.md) — Automatic mapping between Collections and Resources
