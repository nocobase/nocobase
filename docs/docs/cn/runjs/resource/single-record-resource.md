# SingleRecordResource

面向**单条记录**的 Resource：数据为单条对象，支持按主键获取、创建/更新（save）与删除。适用于详情、表单等“单条记录”场景。

继承关系：FlowResource → APIResource → BaseRecordResource → SingleRecordResource。具备 [APIResource](/runjs/resource/api-resource) 的请求能力，并在此基础上扩展资源名、主键与 save/destroy。

创建方式：`ctx.makeResource('SingleRecordResource')` 或 `ctx.initResource('SingleRecordResource')`。使用前需 `setResourceName('集合名')`，按主键操作时需 `setFilterByTk(id)`。

---

## 资源名与主键

| 方法 | 说明 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | 资源名，如 `'users'`、`'users.profile'` |
| `setSourceId(id)` / `getSourceId()` | 关联资源时的父记录 ID |
| `setDataSourceKey(key)` / `getDataSourceKey()` | 数据源标识 |
| `setFilterByTk(tk)` / `getFilterByTk()` | 当前记录主键；设置后 `isNewRecord` 为 false |

---

## 状态

| 属性/方法 | 说明 |
|----------|------|
| `isNewRecord` | 是否为“新建”状态（未设置 filterByTk 或新创建时为 true） |

---

## 请求参数（筛选 / 字段）

| 方法 | 说明 |
|------|------|
| `setFilter(filter)` / `getFilter()` | 筛选（非新建时可用） |
| `setFields(fields)` / `getFields()` | 请求字段 |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | 关联展开 |

---

## CRUD

| 方法 | 说明 |
|------|------|
| `refresh()` | 按当前 `filterByTk` 请求 get，更新 `getData()`；若为新建态则不请求 |
| `save(data, options?)` | 新建时调 create，否则调 update；可选 `{ refresh: false }` |
| `destroy(options?)` | 按当前 `filterByTk` 删除，并清空本地数据 |
| `runAction(actionName, options)` | 调用任意资源 action |

---

## 配置与事件

| 方法 | 说明 |
|------|------|
| `setSaveActionOptions(options)` | save 时的请求配置 |
| `on('refresh', fn)` / `on('saved', fn)` | 刷新完成、保存后触发 |

---

## 示例

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// 更新
await ctx.resource.save({ name: '李四' });

// 新建：不设 filterByTk，直接 save
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: '王五' });
```
