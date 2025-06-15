# FlowResource 及资源体系

`FlowResource` 及其子类用于在流程引擎中管理和操作数据资源。它们封装了数据的获取、设置、同步等常用操作，支持与 API 交互。

## 资源类结构

资源体系的核心类及继承关系如下：

- `FlowResource`：基础资源类，提供数据的基本存取能力。
  - `APIResource`：增加了 API 交互能力。
    - `BaseRecordResource`：为记录资源提供基础功能，是单条和多条记录资源的基类。
      - `SingleRecordResource`：用于管理单个对象（如一条记录）。
      - `MultiRecordResource`：用于管理对象数组（如列表、分页数据）。

## 1. FlowResource

基础资源类，提供数据和元信息的响应式存取能力。

### 主要属性

- `_data`: 使用 `observable.ref` 包装的资源数据，存储当前资源的所有字段信息。
- `_meta`: 使用 `observable.ref` 包装的元信息对象，存储如分页、统计等附加信息。

### 主要方法

- `getData()`: 获取当前数据，返回 `_data.value`。
- `setData(value)`: 设置当前数据，参数为对象，支持链式调用。
- `getMeta(metaKey?)`: 获取元信息，传入 `metaKey` 时返回对应值，否则返回全部元信息对象。
- `setMeta(meta)`: 合并设置元信息，支持链式调用。

### 示例

```ts
const resource = new FlowResource<{ name: string }>();
resource.setData({ name: '张三' });
console.log(resource.getData()); // { name: '张三' }

resource.setMeta({ page: 1, total: 100 });
console.log(resource.getMeta('page')); // 1
console.log(resource.getMeta()); // { page: 1, total: 100 }
```

### 设计说明

- `FlowResource` 只负责本地数据和元信息的响应式存取，不涉及 API 通信。
- 作为基类，通常被其他资源类继承扩展。

---

## 2. APIResource

继承自 `FlowResource`，为资源增加了 API 通信能力，支持配置 URL、参数、headers，并通过 APIClient 拉取数据。

### 主要属性

- `request.url`: 资源的 API 地址，字符串或 null。
- `request.method`: 请求方法（如 'get', 'post' 等），默认为 'get'。
- `request.params`: 请求参数对象。
- `request.headers`: 请求头对象。
- `request.data`: 请求体（可选）。
- `api`: APIClient 实例，用于发起 HTTP 请求。

### 主要方法

- `setAPIClient(api: APIClient)`: 设置 API 客户端实例。
- `getURL()`: 获取当前 API 地址。
- `setURL(value: string)`: 设置 API 地址。
- `setRequestMethod(method: string)`: 设置请求方法。
- `addRequestHeader(key: string, value: string)`: 添加请求头。
- `addRequestParameter(key: string, value: any)`: 添加请求参数。
- `setRequestBody(data: any)`: 设置请求体。
- `setRequestOptions(key: string, value: any)`: 设置 request 对象的任意属性。
- `async refresh()`: 通过 APIClient 拉取数据并更新本地数据（GET 请求）。
- `getRefreshRequestOptions(filterByTk?)`: 获取 refresh 请求的参数和 headers，支持主键过滤。

### 示例

```ts
const apiResource = new APIResource<{ name: string }>();
apiResource.setAPIClient(apiClientInstance);
apiResource.setURL('/users/1');
apiResource.setRequestMethod('get');
apiResource.addRequestHeader('Authorization', 'Bearer token');
await apiResource.refresh();
console.log(apiResource.getData());
```

### 设计说明

- `APIResource` 负责与后端 API 通信，自动管理数据的获取和本地同步。
- 通过组合 APIClient，可灵活适配不同的 API 请求方式和参数。
- 仅实现了 GET（refresh），如需扩展可在子类中实现更多操作（如 POST、PUT、DELETE）。

---

## 3. BaseRecordResource

继承自 `APIResource`，为记录资源提供通用的基础功能，是 `SingleRecordResource` 和 `MultiRecordResource` 的基类。

### 主要属性

- `resourceName`: 资源名称（如 `users`、`users.profile` 等）。
- `sourceId`: 源对象 ID，用于关联资源（如主对象的主键）。
- `request`: 请求配置对象，包含 `url`、`method`、`params`、`headers` 等，`params` 支持过滤、排序、字段选择、白名单、黑名单等常用 API 参数。

### 主要方法

- `buildURL(action?)`: 构建请求 URL，支持关联资源和自定义操作。
- `async runAction(action, options)`: 执行指定操作（如自定义 action），通常为 POST 请求。
- `setResourceName(resourceName) / getResourceName()`: 设置/获取资源名称。
- `setSourceId(sourceId) / getSourceId()`: 设置/获取源对象 ID。
- `setDataSourceKey(dataSourceKey) / getDataSourceKey()`: 设置/获取数据源标识（通过 header）。
- `setFilter(filter) / getFilter()`: 设置/获取过滤条件。
- `setAppends(appends) / getAppends()`: 设置/获取附加字段。
- `addAppends(appends) / removeAppends(appends)`: 添加/移除附加字段。
- `setFilterByTk(filterByTk) / getFilterByTk()`: 设置/获取主键过滤条件。
- `setFields(fields) / getFields()`: 设置/获取字段列表。
- `setSort(sort) / getSort()`: 设置/获取排序字段。
- `setExcept(except) / getExcept()`: 设置/获取排除字段。
- `setWhitelist(whitelist) / getWhitelist()`: 设置/获取白名单字段。
- `setBlacklist(blacklist) / getBlacklist()`: 设置/获取黑名单字段。
- `abstract refresh()`: 抽象方法，需子类实现，用于拉取数据。

### 设计说明

- `BaseRecordResource` 统一封装了常见的 API 参数和资源操作，便于子类扩展。
- 支持链式调用和灵活的参数设置，适配多种业务场景。
- 通过 `buildURL` 和 `runAction` 支持 RESTful 及自定义 action 的请求。

### 示例

```ts
const resource = new SomeRecordResource();
resource.setResourceName('users');
resource.setSourceId(1);
resource.setFilter({ status: 'active' });
resource.setFields(['id', 'name']);
await resource.refresh();
console.log(resource.getData());
```

---

## 4. SingleRecordResource

继承自 `BaseRecordResource`，用于管理单个对象（如一条记录），适合详情页、单条数据的增删改查等场景。

### 主要方法

- `setFilterByTk(filterByTk: string | number)`: 设置主键过滤条件（仅接受单个值），用于指定当前操作的对象。
- `async save(data: TData)`: 保存当前对象。若已设置主键（`filterByTk`），则为更新操作，否则为创建操作。保存后自动刷新数据。
- `async destroy()`: 删除当前对象（根据主键），删除后本地数据设为 null。
- `async refresh()`: 拉取单条记录数据并更新本地数据和元信息。

### 设计说明

- 适用于详情页、单条数据的增删改查等场景。
- 通过 `filterByTk` 精确定位单条记录。
- 所有操作均自动同步本地数据和元信息。

### 示例

```ts
const userResource = new SingleRecordResource<{ id: number; name: string }>();
userResource.setResourceName('users');
userResource.setFilterByTk(1);
await userResource.refresh();
console.log(userResource.getData());

await userResource.save({ name: '新名字' });
await userResource.destroy();
```

---

## 5. MultiRecordResource

继承自 `BaseRecordResource`，用于管理对象数组（如列表、分页数据），适合表格、列表页等场景。

### 主要属性

- `_data`: 响应式存储的数据数组，默认为空数组。
- `request.params.page`: 当前页码，默认为 1。
- `request.params.pageSize`: 每页条数，默认为 20。

### 主要方法

- `async next()`: 加载下一页数据。
- `async previous()`: 加载上一页数据（页码大于 1 时）。
- `async goto(page: number)`: 跳转到指定页码。
- `async create(data: TDataItem)`: 创建新对象，成功后自动刷新数据。
- `async update(filterByTk, data)`: 更新指定对象，成功后自动刷新数据。
- `async destroy(filterByTk)`: 删除指定对象（支持单个或多个主键），成功后自动刷新数据。
- `setPage(page: number) / getPage()`: 设置/获取当前页码。
- `setPageSize(pageSize: number) / getPageSize()`: 设置/获取每页条数。
- `async refresh()`: 拉取列表数据并更新本地数据和元信息。

### 设计说明

- 适用于列表、分页、批量操作等场景。
- 所有数据变更操作（增删改）均自动刷新本地数据和元信息。
- 支持链式调用设置分页参数。

### 示例

```ts
const listResource = new MultiRecordResource<{ id: number; name: string }>();
listResource.setResourceName('users');
await listResource.refresh();
console.log(listResource.getData());

await listResource.create({ name: '新用户' });
await listResource.update(1, { name: '更新名' });
await listResource.destroy([1, 2, 3]);
await listResource.next();
await listResource.setPageSize(50).refresh();
```
