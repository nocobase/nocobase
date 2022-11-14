# Action

Action 是对资源的操作过程的描述，通常包含数据库处理等，类似其他框架中的 service 层，最简化的实现可以是一个 Koa 的中间件函数。在资源管理器里，针对特定资源定义的普通操作函数会被包装成 Action 类型的实例，当请求匹配对应资源的操作时，执行对应的操作过程。

## 构造函数

通常不需要直接实例化 Action，而是由资源管理器自动调用 `Action` 的静态方法 `toInstanceMap()` 进行实例化。

### `constructor(options: ActionOptions)`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `handler` | `Function` | - | 操作函数 |
| `middlewares?` | `Middleware \| Middleware[]` | - | 针对操作的中间件 |
| `values?` | `Object` | - | 默认的操作数据 |
| `fields?` | `string[]` | - | 默认针对的字段组 |
| `appends?` | `string[]` | - | 默认附加的关联字段组 |
| `except?` | `string[]` | - | 默认排除的字段组 |
| `filter` | `FilterOptions` | - | 默认的过滤参数 |
| `sort` | `string[]` | - | 默认的排序参数 |
| `page` | `number` | - | 默认的页码 |
| `pageSize` | `number` | - | 默认的每页数量 |
| `maxPageSize` | `number` | - | 默认最大每页数量 |

## 实例成员

### `actionName`

被实例化后对应的操作名称。在实例化时从请求中解析获取。

### `resourceName`

被实例化后对应的资源名称。在实例化时从请求中解析获取。

### `resourceOf`

被实例化后对应的关系资源的主键值。在实例化时从请求中解析获取。

### `readonly middlewares`

针对操作的中间件列表。

### `params`

操作参数。包含对应操作的所有相关参数，实例化时根据定义的 action 参数初始化，之后请求中解析前端传入的参数并根据对应参数的合并策略合并。如果有其他中间件的处理，也会有类似的合并过程。直到 handler 处理时，访问 params 得到的是经过多次合并的最终参数。

参数的合并过程提供了针对操作处理的可扩展性，可以通过自定义中间件的方式按业务需求进行参数的前置解析和处理，例如表单提交的参数验证就可以在此环节实现。

预设的参数可以参考 [/api/actions] 中不同操作的参数。

参数中还包含请求资源路由的描述部分，具体如下：

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `resourceName` | `string` | - | 资源名称 |
| `resourceIndex` | `string \| number` | - | 资源的主键值 |
| `associatedName` | `string` | - | 所属关系资源的名称 |
| `associatedIndex` | `string \| number` | - | 所属关系资源的主键值 |
| `associated` | `Object` | - | 所属关系资源的实例 |
| `actionName` | `string` | - | 操作名称 |

**示例**

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

## 实例方法

### `mergeParams()`

将额外的参数合并至当前参数集，且可以根据不同的策略进行合并。

**签名**

* `mergeParams(params: ActionParams, strategies: MergeStrategies = {})`

**参数**

| 参数名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `params` | `ActionParams` | - | 额外的参数集 |
| `strategies` | `MergeStrategies` | - | 针对每个参数的合并策略 |

内置操作的默认合并策略如下表：

| 参数名 | 类型 | 默认值 | 合并策略 | 描述 |
| --- | --- | --- | --- | --- |
| `filterByTk` | `number \| string` | - | SQL `and` | 查询主键值 |
| `filter` | `FilterOptions` | - | SQL `and` | 查询过滤参数 |
| `fields` | `string[]` | - | 取并集 | 字段组 |
| `appends` | `string[]` | `[]` | 取并集 | 附加的关联字段组 |
| `except` | `string[]` | `[]` | 取并集 | 排除的字段组 |
| `whitelist` | `string[]` | `[]` | 取交集 | 可处理字段的白名单 |
| `blacklist` | `string[]` | `[]` | 取并集 | 可处理字段的黑名单 |
| `sort` | `string[]` | - | SQL `order by` | 查询排序参数 |
| `page` | `number` | - | 覆盖 | 页码 |
| `pageSize` | `number` | - | 覆盖 | 每页数量 |
| `values` | `Object` | - | 深度合并 | 操作提交的数据 |

**示例**

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
