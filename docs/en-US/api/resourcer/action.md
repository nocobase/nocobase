# Action

Action is the description of the operation process on resource, including database processing and so on. It is like the service layer in other frameworks, and the most simplified implementation can be a Koa middleware function. In the resourcer, common action functions defined for particular resources are wrapped into instances of the type Action, and when the request matches the action of the corresponding resource, the corresponding action is executed.

## Constructor

Instead of being instantiated directly, the Action is usually instantiated automatically by the resourcer by calling the static method `toInstanceMap()` of `Action`.

### `constructor(options: ActionOptions)`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `handler` | `Function` | - | Handler |
| `middlewares?` | `Middleware \| Middleware[]` | - | Middlewares for the action |
| `values?` | `Object` | - | Default action data |
| `fields?` | `string[]` | - | Default list of targeted fields |
| `appends?` | `string[]` | - | Default list of associated fields to append |
| `except?` | `string[]` | - |  Default list of fields to exclude |
| `filter` | `FilterOptions` | - | Default filtering options |
| `sort` | `string[]` | - | Default sorting options |
| `page` | `number` | - | Default page number |
| `pageSize` | `number` | - | Default page size |
| `maxPageSize` | `number` | - | Default max page size |

## Instance Members

### `actionName`

Name of the action that corresponds to when it is instantiated. It is parsed and fetched from the request at instantiation.

### `resourceName`

Name of the resource that corresponds to when the action is instantiated. It is parsed and fetched from the request at instantiation.

### `resourceOf`

Value of the primary key of the relational resource that corresponds to when the action is instantiated. It is parsed and fetched from the request at instantiation.

### `readonly middlewares`

List of middlewares targeting the action.

### `params`

Action parameters. It contains all relevant parameters for the corresponding action, which are initialized at instantiation according to the defined action parameters. Later when parameters passed from the front-end are parsed in requests, the corresponding parameters are merged according to the merge strategy. Similar merging process is done if there is other middleware processing. When it comes to the hander, the `params` are the final parameters that have been merged for several times.

The merging process of parameters provides scalability for action processing, and the parameters can be pre-parsed and processed according to business requirements by means of custom middleware. For example, parameter validation for form submission can be implemented in this part.

Refer to [/api/actions] for the pre-defined parameters of different actions.

The parameters also contain a description of the request resource route:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `resourceName` | `string` | - | Name of the resource |
| `resourceIndex` | `string \| number` | - | Value of the primary key of the resource |
| `associatedName` | `string` | - | Name of the associated resource it belongs to |
| `associatedIndex` | `string \| number` | - | Value of the primary key of the associated resource it belongs to |
| `associated` | `Object` | - | Instance of the associated resource it belongs to |
| `actionName` | `string` | - | Name of the action |

**Example**

```ts
app.resourcer.define('books', {
  actions: {
    publish(ctx, next) {
      ctx.body = ctx.action.params.values;
      // {
      //   id: 1234567890
      //   publishedAt: '2019-01-01',
      // }
    }
  },
  middlewares: [
    async (ctx, next) => {
      ctx.action.mergeParams({
        values: {
          id: Math.random().toString(36).substr(2, 10),
          publishedAt: new Date(),
        }
      });
      await next();
    }
  ]
});
```

## Instance Methods

### `mergeParams()`

Merge additional parameters to the current set of parameters according to different strategies.

**Signature**

* `mergeParams(params: ActionParams, strategies: MergeStrategies = {})`

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `params` | `ActionParams` | - | Additional set of parameters |
| `strategies` | `MergeStrategies` | - | Merge strategies for each parameter |

The default merge strategy for built-in actions is as follows:

| Name | Type | Default | Merge Strategy |Description |
| --- | --- | --- | --- | --- |
| `filterByTk` | `number \| string` | - | SQL `and` | Get value of the primary key |
| `filter` | `FilterOptions` | - | SQL `and` | Get filtering options |
| `fields` | `string[]` | - | Take the union | List of fields |
| `appends` | `string[]` | `[]` | Take the union | List of associated fields to append |
| `except` | `string[]` | `[]` | Take the union | List of associated fields to exclude |
| `whitelist` | `string[]` | `[]` | Take the intersection | Whitelist of fields that can be handled |
| `blacklist` | `string[]` | `[]` | Take the union | Blacklist of fields that can be handled |
| `sort` | `string[]` | - | SQL `order by` | Get the sorting options |
| `page` | `number` | - | Override | Page number |
| `pageSize` | `number` | - | Override | Page size |
| `values` | `Object` | - | Deep merge | Operation of the submitted data |

**Example**

```ts
ctx.action.mergeParams({
  filter: {
    name: 'foo',
  },
  fields: ['id', 'name'],
  except: ['name'],
  sort: ['id'],
  page: 1,
  pageSize: 10,
  values: {
    name: 'foo',
  },
}, {
  filter: 'and',
  fields: 'union',
  except: 'union',
  sort: 'overwrite',
  page: 'overwrite',
  pageSize: 'overwrite',
  values: 'deepMerge',
});
```
