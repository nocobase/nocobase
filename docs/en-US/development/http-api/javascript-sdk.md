# JavaScript SDK

## APIClient

```ts
class APIClient {
  // axios instance
  axios: AxiosInstance;
  // constructors
  constructor(instance?: AxiosInstance | AxiosRequestConfig);
  // Client-side requests, support for AxiosRequestConfig and ResourceActionOptions
  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R>;
  // Get Resources
  resource<R = IResource>(name: string, of?: any): R;
}
```

Initialize instance

```ts
import axios from 'axios';
import { APIClient } from '@nocobase/sdk';

// Provide AxiosRequestConfig configuration parameters
const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

// Provide AxiosInstance
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

## Auth

```ts
// Pass token directly
api.auth.token = '123';
// Or sign in via signIn
api.auth.signIn();
// Log out and delete the token cache
api.auth.signOut();
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
