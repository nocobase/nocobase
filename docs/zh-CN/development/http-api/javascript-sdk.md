# JavaScript SDK

## APIClient

```ts
class APIClient {
  // axios 实例
  axios: AxiosInstance;
  // 构造器
  constructor(instance?: AxiosInstance | AxiosRequestConfig);
  // 客户端请求，支持 AxiosRequestConfig 和 ResourceActionOptions
  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>;
  // 获取资源
  resource<R = IResource>(name: string, of?: any): R;
}
```

初始化实例

```ts
import axios from 'axios';
import { APIClient } from '@nocobase/sdk';

// 提供 AxiosRequestConfig 配置参数
const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

// 提供 AxiosInstance
const instance = axios.create({
  baseURL: 'https://localhost:8000/api',
});
const api = new APIClient(instance);
```

## Mock

```ts
import { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';

const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

const mock = new MockAdapter(api.axios);

mock.onGet('users:get').reply(200, {
  data: { id: 1, name: 'John Smith' },
});

await api.request({ url: 'users:get' });
```

## Storage

APIClient 默认使用的 localStorage，你也可以自定义 Storage，如：

```ts
import { Storage } from '@nocobase/sdk';

class MemoryStorage extends Storage {
  items = new Map();

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key);
  }

  setItem(key: string, value: string) {
    return this.items.set(key, value);
  }

  removeItem(key: string) {
    return this.items.delete(key);
  }
}

const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
  storageClass: CustomStorage,
});
```

## Auth

```ts
// 登录并记录 token
api.auth.signIn({ email, password });
// 注销并删除 token
api.auth.signOut();
// 设置 token
api.auth.setToken('123');
// 设置 role（当需要多角色时）
api.auth.setRole('admin');
// 设置 locale（当需要多语言时）
api.auth.setLocale('zh-CN');
```

自定义 Auth

```ts
import { Auth } from '@nocobase/sdk';

class CustomAuth extends Auth {

}

const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
  authClass: CustomAuth,
});
```

## Request

```ts
// url
await api.request({
  url: 'users:list',
  // request params
  params: {
    filter: {
      'email.$includes': 'noco',
    },
  },
  // request body
  data,
});

// resource & action
await api.request({
  resource: 'users',
  action: 'list',
  // action params
  params: {
    filter: {
      'email.$includes': 'noco',
    },
    page: 1,
  },
});
```

## Resource action

```ts
await api.resource('collection')[action]();
await api.resource('collection.association', collectionId)[action]();
```

## Action API

```ts
await api.resource('collection').create();
await api.resource('collection').get();
await api.resource('collection').list();
await api.resource('collection').update();
await api.resource('collection').destroy();
await api.resource('collection.association', collectionId).create();
await api.resource('collection.association', collectionId).get();
await api.resource('collection.association', collectionId).list();
await api.resource('collection.association', collectionId).update();
await api.resource('collection.association', collectionId).destroy();
```

### `get`

```ts
interface Resource {
  get: (options?: GetActionOptions) => Promise<any>;
}

interface GetActionOptions {
  filter?: any;
  filterByTk?: any;
  fields?: string || string[];
  appends?: string || string[];
  expect?: string || string[];
  sort?: string[];
}
```

### `list`

```ts
interface Resource {
  list: (options?: ListActionOptions) => Promise<any>;
}

interface ListActionOptions {
  filter?: any;
  filterByTk?: any;
  fields?: string || string[];
  appends?: string || string[];
  expect?: string || string[];
  sort?: string[];
  page?: number;
  pageSize?: number;
  paginate?: boolean;
}
```

### `create`

```ts
interface Resource {
  create: (options?: CreateActionOptions) => Promise<any>;
}

interface CreateActionOptions {
  whitelist?: string[];
  blacklist?: string[];
  values?: {[key: sting]: any};
}
```

### `update`

```ts
interface Resource {
  update: (options?: UpdateActionOptions) => Promise<any>;
}

interface UpdateActionOptions {
  filter?: any;
  filterByTk?: any;
  whitelist?: string[];
  blacklist?: string[];
  values?: {[key: sting]: any};
}
```

### `destroy`

```ts
interface Resource {
  destroy: (options?: DestroyActionOptions) => Promise<any>;
}

interface DestroyActionOptions {
  filter?: any;
  filterByTk?: any;
}
```

### `move`

```ts
interface Resource {
  move: (options?: MoveActionOptions) => Promise<any>;
}

interface MoveActionOptions {
  sourceId: any;
  targetId?: any;
  /** @default 'sort' */
  sortField?: any;
  targetScope?: {[key: string]: any};
  sticky?: boolean;
  method?: 'insertAfter' | 'prepend';
}
```

### `<custom>`

```ts
interface AttachmentResource {

}

interface UploadActionOptions {

}

api.resource<AttachmentResource>('attachments').upload();
api.resource('attachments').upload<UploadActionOptions>();
```
