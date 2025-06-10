# FlowResource

`FlowResource` 及其子类用于在流程引擎中管理和操作数据资源。它们封装了数据的获取、设置、同步等常用操作，支持与 API 交互。

## 1. FlowResource

基础资源类，提供数据的基本存取能力。

### 属性

- `_data`: 使用 `observable.ref` 包装的资源数据，存储当前资源的所有字段信息。

### 方法

- `get data()` / `set data(value)`: 获取/设置当前数据的 getter/setter。
- `getData()`: 获取当前数据，返回 `_data.value`。
- `setData(data)`: 设置当前数据，参数为对象。

### 示例

```ts
import { observable } from '@formily/reactive';

export class FlowResource<TData = any> {
  protected _data = observable.ref<TData>(null);

  get data(): TData {
    return this._data.value;
  }

  set data(value: TData) {
    this._data.value = value;
  }

  getData(): TData {
    return this.data;
  }

  setData(data: TData): void {
    this.data = data;
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
- `getRefreshRequestOptions(filterByTk?)`: 获取刷新请求的选项，可选择性传入 filterByTk。
- `async refresh()`: 刷新数据，重新从 API 获取并更新数据。

### 示例

```ts
import { FlowResource } from './flowResource';
import { APIClient } from '@nocobase/sdk';

export class APIResource<TData = any> extends FlowResource<TData> {
  // 请求配置
  protected request = {
    url: null as string | null,
    params: {} as Record<string, any>,
    headers: {} as Record<string, any>,
  };
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

  async refresh() {
    if (!this.api) {
      throw new Error('API client not set');
    }
    const { data } = await this.api.request({
      url: this.url,
      method: 'get',
      ...this.getRefreshRequestOptions(),
    });
    this.setData(data?.data);
  }

  protected getRefreshRequestOptions(filterByTk?: string | number | string[] | number[]) {
    const options = {
      params: { ...this.request.params },
      headers: { ...this.request.headers },
    };
    if (filterByTk) {
      options.params.filterByTk = filterByTk;
    }
    return options;
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

- `resourceName`: 资源名称（如 users、users.profile）。
- `sourceId`: 源对象 ID，用于关联资源。
- `request.params`: 请求参数，包含以下字段：
  - `filter`: 过滤条件对象
  - `filterByTk`: 主键过滤
  - `appends`: 附加字段数组
  - `fields`: 字段数组
  - `sort`: 排序数组
  - `except`: 排除字段数组
  - `whitelist`: 白名单字段数组
  - `blacklist`: 黑名单字段数组

### 方法

- `buildURL(action?)`: 构建请求 URL，支持关联资源。
- `runAction<TData, TMeta>(action, options)`: 执行指定操作。
- `setResourceName(resourceName)` / `getResourceName()`: 设置/获取资源名称。
- `setSourceId(sourceId)` / `getSourceId()`: 设置/获取源对象 ID。
- `setDataSourceKey(dataSourceKey)` / `getDataSourceKey()`: 设置/获取数据源标识。
- `setFilter(filter)` / `getFilter()`: 设置/获取过滤条件。
- `setAppends(appends)` / `getAppends()`: 设置/获取附加字段。
- `addAppends(append)`: 添加附加字段。
- `removeAppends(append)`: 移除附加字段。
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
// 构建的 URL: users:get

// 处理关联资源
resource.setResourceName('users.tags');
resource.setSourceId(1);
// 构建的 URL: users/1/tags:get
```

---

## 4. SingleRecordResource

继承自 `BaseRecordResource`，用于管理单个对象（如一条记录），适合详情页、单条数据的增删改查等场景。

### 典型应用场景

- 获取、更新、删除单条数据（如用户详情、配置项等）。
- 通过关联关系（如用户的 profile）获取嵌套对象。

### 属性

继承 `BaseRecordResource` 的所有属性，使用 `observable.ref` 包装数据。

### 方法

- `setFilterByTk(filterByTk)`: 设置主键过滤条件（仅接受单个值）。
- `async save(data)`: 保存当前对象，根据是否有 filterByTk 决定是创建还是更新。
- `async destroy()`: 删除当前对象。
- `async refresh()`: 刷新数据，重新获取单条记录。

### 示例

```ts
import { observable } from '@formily/reactive';
import { BaseRecordResource } from './baseRecordResource';

export class SingleRecordResource<TData = any> extends BaseRecordResource<TData> {
  protected _data = observable.ref<TData>(null);

  setFilterByTk(filterByTk: string | number): void {
    this.request.params = { ...this.request.params, filterByTk };
  }

  async save(data: TData): Promise<void> {
    const options: any = {
      headers: this.request.headers,
      params: {},
    };
    let actionName = 'create';
    if (this.request.params.filterByTk) {
      options.params.filterByTk = this.request.params.filterByTk;
      actionName = 'update';
    }
    await this.runAction(actionName, {
      ...options,
      data,
    });
    await this.refresh();
  }

  async destroy(): Promise<void> {
    const options: any = {
      headers: this.request.headers,
      params: {},
    };
    options.params.filterByTk = this.request.params.filterByTk;
    await this.runAction('destroy', {
      ...options,
    });
    this.setData(null);
  }

  async refresh(): Promise<void> {
    const options: any = this.getRefreshRequestOptions();
    const { data } = await this.runAction<TData, any>('get', {
      ...options,
      method: 'get',
    });
    this.setData(data.data);
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
- `_data`: 使用 `observable.ref` 包装的数据数组，默认为空数组。
- `_meta`: 使用 `observable.ref` 包装的数据元信息，包含分页等信息。
- `request.params`: 额外包含分页参数：
  - `page`: 当前页码，默认为 1
  - `pageSize`: 每页条数，默认为 20
  - `appends`: 附加字段数组，默认为空数组
  - `fields`: 字段数组，默认为空数组

### 方法

- `async next()`: 加载下一页数据。
- `async previous()`: 加载上一页数据。
- `async goto(page)`: 跳转到指定页。
- `async create(data)`: 创建新对象。
- `async update(filterByTk, data)`: 更新指定对象。
- `async destroy(filterByTk)`: 删除指定对象。
- `getMeta(metaKey?)` / `setMeta(meta)`: 获取/设置数据元信息。
- `setPage(page)` / `getPage()`: 设置/获取当前页码。
- `setPageSize(pageSize)` / `getPageSize()`: 设置/获取每页条数。
- `async refresh()`: 刷新数据，重新获取列表数据。

### 示例

```ts
import { observable } from '@formily/reactive';
import { BaseRecordResource } from './baseRecordResource';

export class MultiRecordResource<TDataItem = any> extends BaseRecordResource<TDataItem[]> {
  protected _data = observable.ref<TDataItem[]>([]);
  protected _meta = observable.ref<Record<string, any>>({});

  // 请求配置 - 与 APIClient 接口保持一致
  protected request = {
    url: null as string | null,
    params: {
      filter: {} as Record<string, any>,
      filterByTk: null as string | number | string[] | number[] | null,
      appends: [] as string[],
      fields: [] as string[],
      sort: null as string[] | null,
      except: null as string[] | null,
      whitelist: null as string[] | null,
      blacklist: null as string[] | null,
      page: 1 as number,
      pageSize: 20 as number,
    } as Record<string, any>,
    headers: {} as Record<string, any>,
  };

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
      data,
    });
    await this.refresh();
  }

  async update(filterByTk: string | number, data: Partial<TDataItem>): Promise<void> {
    const options = {
      params: {
        filterByTk,
      },
      headers: this.request.headers,
    };
    await this.runAction('update', {
      ...options,
      data,
    });
    await this.refresh();
  }

  async destroy(filterByTk: string | number | string[] | number[]): Promise<void> {
    const options = {
      params: {
        filterByTk,
      },
      headers: this.request.headers,
    };
    await this.runAction('destroy', {
      ...options,
    });
    await this.refresh();
  }

  getMeta(metaKey?: string) {
    return metaKey ? this._meta.value[metaKey] : this._meta.value;
  }
  setMeta(meta: Record<string, any>): void {
    this._meta.value = { ...this._meta.value, ...meta };
  }

  async setPage(page: number): Promise<void> {
    this.request.params.page = page;
  }
  getPage(): number {
    return this.request.params.page;
  }
  
  async setPageSize(pageSize: number): Promise<void> {
    this.request.params.pageSize = pageSize;
  }
  getPageSize(): number {
    return this.request.params.pageSize;
  }

  async refresh(): Promise<void> {
    const { data } = await this.runAction<TDataItem[], any>('list', {
      ...this.getRefreshRequestOptions(),
      method: 'get',
    });
    this.setData(data.data);
    this.setMeta(data.meta || {});
    if (data.meta?.page) {
      this.setPage(data.meta.page);
    }
    if (data.meta?.pageSize) {
      this.setPageSize(data.meta.pageSize);
    }
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
