# MultiRecordResource

面向**集合/列表**的 Resource：请求返回数组，支持分页、筛选、排序及增删改查。适用于表格、列表等“多条记录”场景。

继承关系：FlowResource → APIResource → BaseRecordResource → MultiRecordResource。具备 [APIResource](/runjs/resource/api-resource) 的请求能力，并在此基础上扩展资源名、筛选、分页与 CRUD。

创建方式：`ctx.makeResource('MultiRecordResource')` 或 `ctx.initResource('MultiRecordResource')`。使用前需 `setResourceName('集合名')`（如 `'users'`），并依赖 `ctx.api`。

---

## 资源名与数据源

| 方法 | 说明 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | 资源名，如 `'users'`、`'users.tags'` |
| `setSourceId(id)` / `getSourceId()` | 关联资源时的父记录 ID |
| `setDataSourceKey(key)` / `getDataSourceKey()` | 数据源标识 |

---

## 请求参数（筛选 / 字段 / 排序）

| 方法 | 说明 |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | 主键筛选（单条 get 等） |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | 筛选条件 |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | 筛选组 |
| `setFields(fields)` / `getFields()` | 请求字段 |
| `setSort(sort)` / `getSort()` | 排序 |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 关联展开 |

---

## 分页

| 方法 | 说明 |
|------|------|
| `setPage(page)` / `getPage()` | 当前页 |
| `setPageSize(size)` / `getPageSize()` | 每页条数 |
| `getTotalPage()` | 总页数 |
| `getCount()` | 总条数（来自服务端 meta） |
| `next()` / `previous()` / `goto(page)` | 翻页并触发 `refresh` |

---

## 选中行（表格场景）

| 方法 | 说明 |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | 当前选中的行数据 |

---

## CRUD 与列表操作

| 方法 | 说明 |
|------|------|
| `refresh()` | 按当前参数请求 list，更新 `getData()` 与分页 meta |
| `get(filterByTk)` | 请求单条，返回该条数据 |
| `create(data, options?)` | 创建，可选 `{ refresh: false }` 不自动刷新 |
| `update(filterByTk, data, options?)` | 按主键更新 |
| `destroy(filterByTk | row | row[])` | 按主键或行对象删除 |
| `destroySelectedRows()` | 删除当前选中行 |
| `setItem(index, item)` | 本地替换某一行数据 |
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

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();

// 创建
await ctx.resource.create({ name: '张三' });

// 翻页
await ctx.resource.next();
```
