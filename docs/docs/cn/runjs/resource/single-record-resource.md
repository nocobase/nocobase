# SingleRecordResource

面向**单条记录**的 Resource：数据为单条对象，支持按主键获取、创建/更新（save）与删除。适用于详情、表单等“单条记录”场景。与 [MultiRecordResource](./multi-record-resource.md) 不同，SingleRecordResource 的 `getData()` 返回单条对象，通过 `setFilterByTk(id)` 指定主键，`save()` 会根据 `isNewRecord` 自动调用 create 或 update。

**继承关系**：FlowResource → APIResource → BaseRecordResource → SingleRecordResource。

**创建方式**：`ctx.makeResource('SingleRecordResource')` 或 `ctx.initResource('SingleRecordResource')`。使用前需 `setResourceName('数据表名')`；按主键操作时需 `setFilterByTk(id)`；RunJS 中 `ctx.api` 由运行环境注入。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **详情区块** | 详情区块默认使用 SingleRecordResource，按主键加载单条记录 |
| **表单区块** | 新建/编辑表单使用 SingleRecordResource，`save()` 自动区分 create/update |
| **JSBlock 详情** | 在 JSBlock 中加载单条用户、订单等并自定义展示 |
| **关联资源** | 使用 `users.profile` 等形式加载关联单条记录，需配合 `setSourceId(父记录ID)` |

---

## 数据格式

- `getData()` 返回**单条记录对象**，即 get 接口的 `data` 字段
- `getMeta()` 返回元信息（如有）

---

## 资源名与主键

| 方法 | 说明 |
|------|------|
| `setResourceName(name)` / `getResourceName()` | 资源名，如 `'users'`、`'users.profile'`（关联资源） |
| `setSourceId(id)` / `getSourceId()` | 关联资源时的父记录 ID（如 `users.profile` 需传 users 的主键） |
| `setDataSourceKey(key)` / `getDataSourceKey()` | 数据源标识（多数据源时使用） |
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
| `refresh()` | 按当前 `filterByTk` 请求 get，更新 `getData()`；新建态时不请求 |
| `save(data, options?)` | 新建时调 create，否则调 update；可选 `{ refresh: false }` 不自动刷新 |
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

### 基础获取与更新

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// 更新
await ctx.resource.save({ name: '李四' });
```

### 新建记录

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: '王五', email: 'wangwu@example.com' });
```

### 删除记录

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// destroy 后 getData() 为 null
```

### 关联展开与字段

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### 关联资源（如 users.profile）

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // 父记录主键
res.setFilterByTk(profileId);    // 若 profile 为 hasOne 可省略 filterByTk
await res.refresh();
const profile = res.getData();
```

### save 不自动刷新

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// 保存后不触发 refresh，getData() 保持旧值
```

### 监听 refresh / saved 事件

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>用户: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('保存成功');
});
await ctx.resource?.refresh?.();
```

---

## 注意事项

- **setResourceName 必填**：使用前必须调用 `setResourceName('数据表名')`，否则无法构建请求 URL。
- **filterByTk 与 isNewRecord**：未设置 `setFilterByTk` 时 `isNewRecord` 为 true，`refresh()` 不会发起请求；`save()` 会走 create。
- **关联资源**：资源名为 `parent.child` 时（如 `users.profile`），需先 `setSourceId(父记录主键)`。
- **getData 为对象**：单条接口返回的 `data` 为记录对象，`getData()` 直接返回该对象；`destroy()` 后为 null。

---

## 相关

- [ctx.resource](../context/resource.md) - 当前上下文中的 resource 实例
- [ctx.initResource()](../context/init-resource.md) - 初始化并绑定到 ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - 新建 resource 实例，不绑定
- [APIResource](./api-resource.md) - 通用 API 资源，按 URL 请求
- [MultiRecordResource](./multi-record-resource.md) - 面向数据表/列表，支持 CRUD、分页
