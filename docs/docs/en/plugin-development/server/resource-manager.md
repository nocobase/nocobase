# ResourceManager

NocoBase's ResourceManager can automatically convert existing collections and associations into resources. It has various built-in action types to help developers quickly build REST API resource actions. Slightly different from traditional REST APIs, NocoBase's resource actions do not rely on HTTP request methods, but rather determine the specific operation to be executed by explicitly defining `:action`.

## Auto-generated Resources

NocoBase automatically converts `collection` and `association` defined in the database into resources. For example, if two collections, `posts` and `comments`, are defined:

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

| Request Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/posts:list` | List |
| `GET` | `/api/posts:get/1` | Get |
| `POST` | `/api/posts:create` | Create |
| `POST` | `/api/posts:update/1` | Update |
| `POST` | `/api/posts:destroy/1` | Destroy |

| Request Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/tags:list` | List |
| `GET` | `/api/tags:get/1` | Get |
| `POST` | `/api/tags:create` | Create |
| `POST` | `/api/tags:update/1` | Update |
| `POST` | `/api/tags:destroy/1` | Destroy |

| Request Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/posts/1/tags:list` | List all tags associated with a `post` |
| `GET` | `/api/posts/1/tags:get/1` | Get a single `tag` under a `post` |
| `POST` | `/api/posts/1/tags:create` | Create a single `tag` under a `post` |
| `POST` | `/api/posts/1/tags:update/1` | Update a single `tag` under a `post` |
| `POST` | `/api/posts/1/tags:destroy/1` | Destroy a single `tag` under a `post` |
| `POST` | `/api/posts/1/tags:add` | Add associated `tags` to a `post` |
| `POST` | `/api/posts/1/tags:remove` | Remove associated `tags` from a `post` |
| `POST` | `/api/posts/1/tags:set` | Set all associated `tags` for a `post` |
| `POST` | `/api/posts/1/tags:toggle` | Toggle the association of `tags` for a `post` |

:::tip Tip

NocoBase's resource actions do not directly depend on the request method, but rather determine the operation to be executed through an explicit `:action` definition.

:::

## Resource Actions

NocoBase provides a rich set of built-in action types to meet various business needs.

### Basic CRUD Actions

| Action Name | Description | Applicable Resource Type | Request Method | Example Path |
| --- | --- | --- | --- | --- |
| `list` | List records | All | GET/POST | `/api/posts:list` |
| `get` | Get a single record | All | GET/POST | `/api/posts:get/1` |
| `create` | Create a new record | All | POST | `/api/posts:create` |
| `update` | Update a record | All | POST | `/api/posts:update/1` |
| `destroy` | Delete a record | All | POST | `/api/posts:destroy/1` |
| `firstOrCreate` | Find the first record, or create it if it does not exist | All | POST | `/api/users:firstOrCreate` |
| `updateOrCreate` | Update a record, or create it if it does not exist | All | POST | `/api/users:updateOrCreate` |

### Association Actions

| Action Name | Description | Applicable Association Type | Example Path |
| --- | --- | --- | --- |
| `add` | Add association | `hasMany`, `belongsToMany` | `/api/posts/1/tags:add` |
| `remove` | Remove association | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:remove` |
| `set` | Reset association | `hasOne`, `hasMany`, `belongsToMany`, `belongsTo` | `/api/posts/1/comments:set` |
| `toggle` | Add or remove association | `belongsToMany` | `/api/posts/1/tags:toggle` |

### Action Parameters

Common action parameters include:

*   `filter`: Query conditions
*   `values`: Values to be set
*   `fields`: Specify returned fields
*   `appends`: Include associated data
*   `except`: Exclude fields
*   `sort`: Sorting rules
*   `page`, `pageSize`: Pagination parameters
*   `paginate`: Enable pagination
*   `tree`: Return data in a tree structure
*   `whitelist`, `blacklist`: Field whitelist/blacklist
*   `updateAssociationValues`: Update association values

---

## Custom Resource Actions

NocoBase allows registering additional actions for existing resources. You can use `registerActionHandlers` to customize actions for all or specific resources.

### Register Global Actions

```ts
resourceManager.registerActionHandlers({
  customAction: async (ctx) => {
    ctx.body = { resource: ctx.action.resourceName };
  },
});
```

### Register Actions for Specific Resources

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

Naming convention: `resourceName:actionName`. Use dot notation for associations (e.g., `posts.comments`).

## Custom Resources

If you need to provide resources that are not related to a collection, you can use the `resourceManager.define` method to define them:

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

The request method is consistent with auto-generated resources:

*   `GET /api/app:getInfo`
*   `POST /api/app:getInfo` (Both GET/POST are supported by default)

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

## Specific Context Properties

Entering the `resourceManager` layer's middleware or action implies that the resource must exist.

### ctx.action

-   `ctx.action.actionName`: Action name
-   `ctx.action.resourceName`: Can be a collection or an association
-   `ctx.action.params`: Action parameters

### ctx.dataSource

The current data source object

### ctx.getCurrentRepository()

The current repository object

## How to Get ResourceManager Objects for Different Data Sources

`resourceManager` belongs to a data source, and you can register actions for different data sources separately.

### Main Data Source

For the main data source, you can directly use `app.resourceManager` to perform operations:

```ts
app.resourceManager.registerActionHandlers();
```

### Other Data Sources

For other data sources, you can get a specific data source instance through `dataSourceManager` and use its `resourceManager` to perform operations:

```ts
const dataSource = dataSourceManager.get('external');
dataSource.resourceManager.registerActionHandlers();
```

### Iterating Through All Data Sources

If you need to perform the same operation on all added data sources, you can use the `dataSourceManager.afterAddDataSource` method to iterate through them, ensuring that the corresponding actions are registered for each data source's `resourceManager`:

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandlers();
});
```