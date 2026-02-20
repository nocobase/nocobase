# MultiRecordResource

面向数据表的 Resource：请求返回数组，支持分页、筛选、排序及增删改查。适用于表格、列表等“多条记录”场景。与 [APIResource](./api-resource.md) 不同，MultiRecordResource 通过 `setResourceName()` 指定资源名，自动构建 `users:list`、`users:create` 等 URL，并内置分页、筛选、选中行等能力。

**继承关系**：FlowResource → APIResource → BaseRecordResource → MultiRecordResource。

**创建方式**：`ctx.makeResource('MultiRecordResource')` 或 `ctx.initResource('MultiRecordResource')`。使用前需 `setResourceName('数据表名')`（如 `'users'`）；RunJS 中 `ctx.api` 由运行环境注入。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **表格区块** | 表格、列表区块默认使用 MultiRecordResource，支持分页、筛选、排序 |
| **JSBlock 列表** | 在 JSBlock 中加载用户、订单等数据表数据并自定义渲染 |
| **批量操作** | 通过 `getSelectedRows()` 获取选中行，`destroySelectedRows()` 批量删除 |
| **关联资源** | 使用 `users.tags` 等形式加载关联数据表，需配合 `setSourceId(父记录ID)` |

---

## 数据格式

- `getData()` 返回**记录数组**，即 list 接口的 `data` 字段
- `getMeta()` 返回分页等元信息：`page`、`pageSize`、`count`、`totalPage` 等

---

## 资源名与数据源

| 方法 | 说明 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | 资源名，如 `'users'`、`'users.tags'`（关联资源） |
| `setSourceId(id)` / `getSourceId()` | 关联资源时的父记录 ID（如 `users.tags` 需传 users 的主键） |
| `setDataSourceKey(key)` / `getDataSourceKey()` | 数据源标识（多数据源时使用） |

---

## 请求参数（筛选 / 字段 / 排序）

| 方法 | 说明 |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | 主键筛选（单条 get 等） |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | 筛选条件，支持 `$eq`、`$ne`、`$in` 等操作符 |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | 筛选组（多条件组合） |
| `setFields(fields)` / `getFields()` | 请求字段（白名单） |
| `setSort(sort)` / `getSort()` | 排序，如 `['-createdAt']` 表示按创建时间倒序 |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 关联展开（如 `['user', 'tags']`） |

---

## 分页

| 方法 | 说明 |
|------|------|
| `setPage(page)` / `getPage()` | 当前页（从 1 开始） |
| `setPageSize(size)` / `getPageSize()` | 每页条数，默认 20 |
| `getTotalPage()` | 总页数 |
| `getCount()` | 总条数（来自服务端 meta） |
| `next()` / `previous()` / `goto(page)` | 翻页并触发 `refresh` |

---

## 选中行（表格场景）

| 方法 | 说明 |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | 当前选中的行数据，用于批量删除等操作 |

---

## CRUD 与列表操作

| 方法 | 说明 |
|------|------|
| `refresh()` | 按当前参数请求 list，更新 `getData()` 与分页 meta，触发 `'refresh'` 事件 |
| `get(filterByTk)` | 请求单条，返回该条数据（不写入 getData） |
| `create(data, options?)` | 创建，可选 `{ refresh: false }` 不自动刷新，触发 `'saved'` |
| `update(filterByTk, data, options?)` | 按主键更新 |
| `destroy(target)` | 删除；target 可为主键、行对象或主键/行数组（批量删除） |
| `destroySelectedRows()` | 删除当前选中行（无选中时抛出错误） |
| `setItem(index, item)` | 本地替换某一行数据（不发起请求） |
| `runAction(actionName, options)` | 调用任意资源 action（如自定义 action） |

---

## 配置与事件

| 方法 | 说明 |
|------|------|
| `setRefreshAction(name)` | 刷新时调用的 action，默认 `'list'` |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | create/update 的请求配置 |
| `on('refresh', fn)` / `on('saved', fn)` | 刷新完成、保存后触发 |

---

## 示例

### 基础列表

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### 筛选与排序

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### 关联展开

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### 创建与翻页

```js
await ctx.resource.create({ name: '张三', email: 'zhangsan@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### 批量删除选中行

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('请先选择数据');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('已删除'));
```

### 监听 refresh 事件

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### 关联资源（子表）

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## 注意事项

- **setResourceName 必填**：使用前必须调用 `setResourceName('数据表名')`，否则无法构建请求 URL。
- **关联资源**：资源名为 `parent.child` 时（如 `users.tags`），需先 `setSourceId(父记录主键)`。
- **refresh 防抖**：同一事件循环内多次调用 `refresh()` 只会执行最后一次，避免重复请求。
- **getData 为数组**：列表接口返回的 `data` 即为记录数组，`getData()` 直接返回该数组。

---

## 相关

- [ctx.resource](../context/resource.md) - 当前上下文中的 resource 实例
- [ctx.initResource()](../context/init-resource.md) - 初始化并绑定到 ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - 新建 resource 实例，不绑定
- [APIResource](./api-resource.md) - 通用 API 资源，按 URL 请求
- [SingleRecordResource](./single-record-resource.md) - 面向单条记录
