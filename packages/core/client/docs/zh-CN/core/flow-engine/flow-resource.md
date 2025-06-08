# FlowResource

`FlowResource` 及其子类用于在流程引擎中管理和操作数据资源。它们封装了数据的获取、设置、同步等常用操作，支持与 API 交互。

## 1. FlowResource

基础资源类，提供数据的基本存取能力。

### 属性

- `state.data`: 资源数据，存储当前资源的所有字段信息。
- `meta`: 资源元信息，使用 observable.shallow 包装。

### 方法

- `get data()` / `set data(value)`: 获取/设置当前数据的 getter/setter。
- `getData()`: 获取当前数据，返回 `state.data`。
- `setData(data)`: 设置当前数据，参数为对象。

### 示例

```ts
import { observable } from '@formily/reactive';

export class FlowResource<TData = any> {
  // 资源元信息
  protected meta = observable.shallow({});

  // 数据状态 - 包含数据和动态信息
  protected state = observable.shallow({
    data: {} as TData,
  });

  get data(): TData {
    return this.state.data;
  }

  set data(value: TData) {
    this.state.data = value;
  }

  getData(): TData {
    return this.state.data;
  }

  setData(data: TData): void {
    this.state.data = data;
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
- `request.url`: 资源的 API 地址，字符串类型。
- `request.params`: 请求参数对象。
- `request.headers`: 请求头对象。

### 方法

- `get url()` / `set url(value)`: 获取/设置 API 地址。
- `getURL()` / `setURL(value)`: 获取/设置 API 地址。
- `setAPIClient(api)`: 设置 API 客户端实例。
- `getRequestOptions()`: 获取请求参数对象，包含 url、params、headers。
- `async refresh()`: 刷新数据，重新从 API 获取并更新数据。

### 示例

```ts
import { FlowResource } from './flowResource';
import { APIClient } from '@nocobase/sdk';
import { observable } from '@formily/reactive';

export class APIResource<TData = any> extends FlowResource<TData> {
  // 请求配置
  protected request = observable.shallow({
    url: null as string | null,
    params: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  });
  api: APIClient;

  setAPIClient(api: APIClient): void {
    this.api = api;
  }

  get url(): string | null {
    return this.request.url;
  }

  set url(value: string | null) {
    this.request.url = value;
  }

  getURL(): string | null {
    return this.request.url;
  }

  setURL(value: string | null): void {
    this.request.url = value;
  }

  getRequestOptions(): any {
    return {
      url: this.url,
      params: this.request.params,
      headers: this.request.headers,
    };
  }

  async refresh(): Promise<void> {
    if (!this.api) {
      throw new Error('API client not set');
    }
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

## 3. BaseRecordResource

继承自 `APIResource`，为记录资源提供基础功能，是 `SingleRecordResource` 和 `MultiRecordResource` 的基类。

### 属性

- `meta.resourceName`: 资源名称（如 users、users.profile）。
- `meta.sourceId`: 源对象 ID，用于关联资源。
- `meta.actionName`: 操作名，默认为 'get'。
- `request.params`: 请求参数，包含以下字段：
  - `filter`: 过滤条件对象
  - `filterByTk`: 主键过滤
  - `appends`: 附加字段数组
  - `fields`: 字段数组
  - `sort`: 排序字符串
  - `except`: 排除字段
  - `whitelist`: 白名单字段
  - `blacklist`: 黑名单字段

### 方法

- `getRequestOptions(filterByTk?)`: 获取请求选项，可选择性传入 filterByTk。
- `buildURL(action?)`: 构建请求 URL，支持关联资源。
- `runAction<T>(action, options)`: 执行指定操作。
- `setResourceName(resourceName)` / `getResourceName()`: 设置/获取资源名称。
- `setActionName(actionName)` / `getActionName()`: 设置/获取操作名。
- `setSourceId(sourceId)` / `getSourceId()`: 设置/获取源对象 ID。
- `setDataSourceKey(dataSourceKey)` / `getDataSourceKey()`: 设置/获取数据源标识。
- `setFilter(filter)` / `getFilter()`: 设置/获取过滤条件。
- `setAppends(appends)` / `getAppends()`: 设置/获取附加字段。
- `setFilterByTk(filterByTk)` / `getFilterByTk()`: 设置/获取主键过滤。
- `setFields(fields)` / `getFields()`: 设置/获取字段。
- `setSort(sort)` / `getSort()`: 设置/获取排序。
- `setExcept(except)` / `getExcept()`: 设置/获取排除字段。
- `setWhitelist(whitelist)` / `getWhitelist()`: 设置/获取白名单。
- `setBlacklist(blacklist)` / `getBlacklist()`: 设置/获取黑名单。
- `abstract refresh()`: 抽象方法，需要子类实现。

### 示例

```ts
// 处理普通资源
const resource = new BaseRecordResource();
resource.setResourceName('users');
resource.setActionName('list');
// 构建的 URL: users:list

// 处理关联资源
resource.setResourceName('users.tags');
resource.setSourceId(1);
resource.setActionName('list');
// 构建的 URL: users/1/tags:list
```

---

## 4. SingleRecordResource

继承自 `BaseRecordResource`，用于管理单个对象（如一条记录），适合详情页、单条数据的增删改查等场景。

### 典型应用场景

- 获取、更新、删除单条数据（如用户详情、配置项等）。
- 通过关联关系（如用户的 profile）获取嵌套对象。

### 属性

继承 `BaseRecordResource` 的所有属性，默认 `actionName` 为 'get'。

### 方法

- `setFilterByTk(filterByTk)`: 设置主键过滤条件。
- `async save(data)`: 保存当前对象，根据是否有 filterByTk 决定是创建还是更新。
- `async destroy()`: 删除当前对象。
- `async refresh()`: 刷新数据，重新获取单条记录。

### 示例

```ts
import { BaseRecordResource } from './baseRecordResource';

export class SingleRecordResource<TData = any> extends BaseRecordResource<TData> {
  constructor() {
    super();
    // 设置单记录资源的默认 actionName
    this.meta.actionName = 'get';
  }

  setFilterByTk(filterByTk: string | number): void {
    this.request.params = { ...this.request.params, filterByTk };
  }

  async save(data: TData): Promise<void> {
    await this.runAction(this.request.params.filterByTk ? 'update' : 'create', {
      ...this.getRequestOptions(),
      data,
    });
    await this.refresh();
  }

  async destroy(): Promise<void> {
    await this.runAction('destroy', this.getRequestOptions());
    this.setData(null);
  }

  async refresh(): Promise<void> {
    const { data } = await this.runAction<{ data: TData }>(this.meta.actionName, this.getRequestOptions());
    this.setData(data);
  }
}

// 使用示例
const resource = new SingleRecordResource();
resource.setResourceName('users');
resource.setFilterByTk(1);
await resource.refresh(); // 获取 id 为 1 的用户

// 关联资源示例
const profileResource = new SingleRecordResource();
profileResource.setResourceName('users.profile');
profileResource.setSourceId(1);
await profileResource.refresh(); // 获取用户 1 的 profile
```

---

## 5. MultiRecordResource

继承自 `BaseRecordResource`，用于管理对象数组（如列表、分页数据），适合表格、列表页等场景。

### 典型应用场景

- 获取、分页、筛选多条数据（如用户列表、订单列表）。
- 支持批量创建、更新、删除等操作。

### 属性

继承 `BaseRecordResource` 的所有属性，并额外包含：
- `state.data`: 数据数组，默认为空数组。
- `state.dataMeta`: 数据元信息，包含分页等信息。
- `request.params`: 额外包含分页参数：
  - `page`: 当前页码，默认为 1
  - `pageSize`: 每页条数，默认为 20

默认 `actionName` 为 'list'。

### 方法

- `async next()`: 加载下一页数据。
- `async previous()`: 加载上一页数据。
- `async goto(page)`: 跳转到指定页。
- `async create(data)`: 创建新对象。
- `async update(filterByTk, data)`: 更新指定对象。
- `async destroy(filterByTk)`: 删除指定对象。
- `setDataMeta(dataMeta)` / `getDataMeta()`: 设置/获取数据元信息。
- `setPage(page)` / `getPage()`: 设置/获取当前页码。
- `setPageSize(pageSize)` / `getPageSize()`: 设置/获取每页条数。
- `async refresh()`: 刷新数据，重新获取列表数据。

### 示例

```ts
import { observable } from '@formily/reactive';
import { BaseRecordResource } from './baseRecordResource';

export class MultiRecordResource<TDataItem = any> extends BaseRecordResource<TDataItem[]> {
  // 数据状态 - 包含数据和动态信息
  protected state = observable.shallow({
    data: [] as TDataItem[],
    dataMeta: {} as Record<string, any>,
  });

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = observable.shallow({
    url: null as string | null,
    params: {
      filter: {} as Record<string, any>,
      filterByTk: null as string | number | string[] | number[] | null,
      appends: [] as string[],
      fields: [] as string[],
      sort: null as string | null,
      except: null as string | null,
      whitelist: null as string | null,
      blacklist: null as string | null,
      page: 1 as number,
      pageSize: 20 as number,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  });

  constructor() {
    super();
    this.meta.actionName = 'list';
  }

  async next(): Promise<void> {
    this.request.params.page += 1;
    await this.refresh();
  }

  async previous(): Promise<void> {
    if (this.request.params.page > 1) {
      this.request.params.page -= 1;
      await this.refresh();
    }
  }

  async goto(page: number): Promise<void> {
    if (page > 0) {
      this.request.params.page = page;
      await this.refresh();
    }
  }

  async create(data: TDataItem): Promise<void> {
    await this.runAction('create', {
      ...this.getRequestOptions(),
      data,
    });
    await this.refresh();
  }

  async update(filterByTk: string | number, data: Partial<TDataItem>): Promise<void> {
    await this.runAction('update', {
      ...this.getRequestOptions(filterByTk),
      data,
    });
    await this.refresh();
  }

  async destroy(filterByTk: string | number | string[] | number[]): Promise<void> {
    await this.runAction('destroy', {
      ...this.getRequestOptions(filterByTk),
    });
    await this.refresh();
  }

  setDataMeta(dataMeta: Record<string, any>) {
    this.state.dataMeta = dataMeta;
  }

  getDataMeta(): Record<string, any> {
    return this.state.dataMeta;
  }

  setPage(page: number): void {
    this.request.params.page = page;
  }
  
  getPage(): number {
    return this.request.params.page;
  }
  
  setPageSize(pageSize: number): void {
    this.request.params.pageSize = pageSize;
  }
  
  getPageSize(): number {
    return this.request.params.pageSize;
  }

  async refresh(): Promise<void> {
    const { data, meta } = await this.runAction<{ data: any[], meta?: any }>(this.meta.actionName, this.getRequestOptions());
    this.setData(data);
    this.setDataMeta(meta);
  }
}

// 使用示例
const resource = new MultiRecordResource();
resource.setResourceName('users');
resource.setPageSize(10);
await resource.refresh(); // 获取用户列表

await resource.next(); // 下一页
await resource.previous(); // 上一页
await resource.goto(3); // 跳转到第3页

// 创建用户
await resource.create({ name: 'John', email: 'john@example.com' });

// 更新用户
await resource.update(1, { name: 'Jane' });

// 删除用户
await resource.destroy(1);
```
