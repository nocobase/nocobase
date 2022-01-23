---
toc: menu
---

# Context

## ctx.db

##### Definition

```ts
interface Context {
  db: Database;
}
```

##### Examples

```ts
async (ctx, next) {
  const User = ctx.db.getCollection('users');
}
```

## ctx.resourcer

## ctx.action <Badge>待完善</Badge>

```ts
class IAction {
  resourceName: string;
  actionName: string;
  resourceOf?: string;
  params?: ActionParams;
  mergeParams?: (params: ActionParams, strategies?: MergeStrategies): void;
}

interface ActionParams {
  filterByTk?: any;
  filter?: any;
  fields?: string[];
  sort?: string[];
  page?: string | number;
  pageSize?: string | number;
  values?: any;
  [key: string]?: any;
}
```

如查看 posts 的 id=1 的 comments

```bash
GET /api/posts/1/comments:list?filter={"f1":"v1"}&fields=f1,f2
```

对应 ctx.action 的主要参数：

```ts
{
  resourceName: 'posts.comments',
  resourceOf: 1,
  actionName: 'list',
  params: {
    filter: {f1: 'v1'},
    fields: ['f1', 'f2'],
  },
}
```

### action.params

request body

- `values` bodyparser 之后的 body

request query

- `filter`
- `fields`
- `pageSize`
- `page`
- `sort`
- 其他参数

### action.mergeParams();

```ts
interface mergeParams {
  (params: ActionParams, strategies?: MergeStrategies): void;
}

type MergeStrategyType = 'merge' | 'deepMerge' | 'overwrite' | 'andMerge' | 'orMerge' | 'intersect' | 'union';
type MergeStrategyFunc = (x: any, y: any) => any;
type MergeStrategy = MergeStrategyType | MergeStrategyFunc;

interface MergeStrategies {
  [key: string]: MergeStrategy;
}
```

合并策略

- `merge` 浅合并
- `deepMerge` 深层合并（默认）
- `andMerge` and 合并，用于 filter 参数
- `orMerge` or 合并，用于 filter 参数
- `overwrite` 覆盖
- `intersect` 交集，用于 array 类型，也支持逗号间隔的字符串数组
- `union` 并集，去重，用于 array 类型，也支持逗号间隔的字符串数组

特定参数的默认合并策略

```ts
{
  filter: 'andMerge',
  fields: 'intersect',
  appends: 'union',
  except: 'union',
  whitelist: 'intersect',
  blacklist: 'union',
  sort: 'overwrite',
}
```

示例

```ts
ctx.action.mergeParams({
  filter: { b: 'b1' },
  fields: 'a1,b1,c1',
  key1: 'abcdef',
}, {
  // filter 参数采用 orMerge 策略
  filter: 'orMerge',
  // fields 参数采用 intersect 策略
  fields: 'intersect',
  // key1 自定义函数
  key1: (x, y) => y.split(''),
});
```

## ctx.i18n

app.i18n 的 cloneInstance。详情见 [I18next API](https://www.i18next.com/overview/api)

##### Definition

```ts
interface Context {
  i18n: I18next.I18n;
}
```

##### Examples

```ts
async (ctx, next) {
  await ctx.i18n.changeLanguage('zh-CN');
}
```

## ctx.t()

