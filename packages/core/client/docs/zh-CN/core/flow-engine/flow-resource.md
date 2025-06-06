# FlowResource

`FlowResource` 及其子类用于在流程引擎中管理和操作数据资源。它们封装了数据的获取、设置、同步等常用操作，支持与 API 交互。

## 1. FlowResource

基础资源类，提供数据的基本存取能力。

### 属性

- `meta.data`: 资源数据，存储当前资源的所有字段信息。

### 方法

- `getData()`: 获取当前数据，返回 `meta.data`。
- `setData(data)`: 设置当前数据，参数为对象。

### 示例

```ts
class FlowResource {
  meta = observable.shallow({
    data: {},
  });

  get data() {
    return this.meta.data;
  }

  set data(value) {
    this.meta.data = value;
  }

  getData() {
    return this.meta.data;
  }

  setData(data) {
    this.meta.data = data;
  }
}

const resource = new FlowResource();
resource.setData({ name: 'test' });
console.log(resource.getData()); // { name: 'test' }
```

---

## 2. APIResource

继承自 `FlowResource`，增加了 API 交互能力。

### 属性

- `api`: APIClient 实例，用于发起请求。
- `meta.url`: 资源的 API 地址，字符串类型。
- `meta.data`: 资源数据。

### 方法

- `get url` / `set url(value)`: 获取/设置 API 地址。
- `getURL()` / `setURL(value)`: 获取/设置 API 地址。
- `setAPIClient(api)`: 设置 API 客户端实例。
- `getRequestOptions()`: 获取请求参数对象，通常包含 url、params 等。
- `async refresh()`: 刷新数据，重新从 API 获取并更新 `meta.data`。

### 示例

```ts
class APIResource extends FlowResource {
  api: APIClient;

  meta = observable.shallow({
    url: null,
    data: {},
  });

  get url() {
    return this.meta.url;
  }

  set url(value) {
    this.meta.url = value;
  }

  getURL() {
    return this.meta.url;
  }

  setURL(value) {
    this.meta.url = value;
  }

  setAPIClient(api) {
    this.api = api;
  }

  getRequestOptions() {
    return {
      url: this.url,
    }
  }

  async refresh() {
    const { data } = await this.api.request(this.getRequestOptions());
    this.setData(data);
  }
}

const api = new APIClient();
const resource = new APIResource();
resource.setAPIClient(api);
resource.url = '/api/resource';
await resource.refresh();
console.log(resource.data); // 输出刷新后的数据
```

---

## 3. SingleRecordResource

用于管理单个对象（如一条记录），适合详情页、单条数据的增删改查等场景。支持通过主键、关联关系等灵活获取对象。

### 典型应用场景

- 获取、更新、删除单条数据（如用户详情、配置项等）。
- 通过关联关系（如用户的 profile）获取嵌套对象。

### 属性

- `meta.filter`: 过滤条件（对象），如 `{ status: 'active' }`。
- `meta.filterByTk`: 主键过滤（如 id），通常为数字或字符串。
- `meta.appends`: 附加字段（数组），如 `['profile']`。
- `meta.data`: 当前对象数据。
- `meta.meta`: 额外元信息，如接口返回的分页、统计等信息。
- `meta.errors`: 错误信息，数组类型。
- `meta.dataSourceKey`: 数据源标识，用于区分不同数据源。
- `meta.resourceName`: 资源名称（如 users、users.profile）。
- `meta.sourceId`: 源对象 ID，用于关联资源。
- `meta.actionName`: 操作名，默认为 get，可为 update、delete 等。

### 方法

- `getRequestOptions()`: 根据当前 meta 生成请求参数，自动拼接关联路径和参数。
- `async save(data, options)`: 保存当前对象，参数可选，默认实现为刷新，可扩展为提交变更。
- `async destroy()`: 删除当前对象，默认实现为刷新，可扩展为实际删除。

### 示例

```ts
class SingleRecordResource extends APIResource {
  meta = observable.shallow({
    filter: {},
    filterByTk: null,
    appends: [],
    data: {},
    meta: {},
    errors: [],
    dataSourceKey: null,
    resourceName: null,
    sourceId: null,
    actionName: 'get',
  });

  getRequestOptions() {
    return {}
  }

  async save(options) {
    await this.refresh();
  }

  async destroy() {
    const options = this.getRequestOptions();
    // destroy
    this.request({
        url: '',
        ...options,
    })
    await this.refresh();
  }
}

const resource = new SingleRecordResource();
resource.resourceName = 'users';
resource.filterByTk = 1;
// {
//   url: 'users:get',
//   param: {
//     filterByTk: 1,
//   }
// }
await resource.save(data, options);
// {
//   url: 'users:get',
//   param: {
//     filterByTk: 1,
//   }
//   data: {},
// }
```

```ts
const resource = new SingleRecordResource();
resource.resourceName = 'users.profile';
resource.sourceId = 1;
// {
//   url: 'users/1/profile:get',
// }
await resource.save(data, options);
// {
//   url: 'users/1/profile:update',
//   data: {},
// }
```

---

## 4. MultiRecordResource

用于管理对象数组（如列表、分页数据），适合表格、列表页等场景。支持分页、批量操作等。

### 典型应用场景

- 获取、分页、筛选多条数据（如用户列表、订单列表）。
- 支持批量创建、更新、删除等操作。

### 属性

- `meta.filter`: 过滤条件（对象），如 `{ status: 'active' }`。
- `meta.filterByTk`: 主键过滤（如 id），可用于批量操作。
- `meta.page`: 当前页码，默认为 1。
- `meta.pageSize`: 每页条数，默认为 20。
- `meta.appends`: 附加字段（数组）。
- `meta.data`: 当前数据数组。
- `meta.meta`: 额外元信息（如分页信息）。
- `meta.errors`: 错误信息。
- `meta.dataSourceKey`: 数据源标识。
- `meta.resourceName`: 资源名称（如 users、users.tags）。
- `meta.sourceId`: 源对象 ID。
- `meta.actionName`: 操作名，默认为 list。

### 方法

- `getRequestOptions()`: 生成请求参数（需根据业务实现）。
- `next()`: 加载下一页数据（需实现，通常会自增 page 并刷新）。
- `previous()`: 加载上一页数据（需实现，通常会自减 page 并刷新）。
- `create(data)`: 创建新对象（需实现，参数为对象）。
- `update(filterByTk, data)`: 更新对象（需实现，参数为主键和数据）。
- `destroy(filterByTk)`: 删除对象（需实现，参数为主键）。

### 示例

```ts
class MultiRecordResource extends APIResource {
  meta = observable.shallow({
    filter: {},
    filterByTk: null,
    page: 1,
    pageSize: 20,
    appends: [],
    data: [],
    meta: {},
    errors: [],
    dataSourceKey: null,
    collectionName: null,
    sourceId: null,
  });

  getRequestOptions() {}

  next() {}
  previous() {}
  goto(page) {}
  create(data) {}
  update(filterByTk, data) {}
  destroy(filterByTk) {}
}

const resource = new MultiRecordResource();
resource.meta.resourceName = 'orders';
await resource.next(); // 加载下一页
```
