# JavaScript SDK

## 初始化实例

```ts
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseUrl: 'https://demo.nocobase.com/api',
});
```

## Auth

```ts
api.auth.signIn();
api.auth.signOut();
```

## Request URL

```ts
api.request({
  url: 'app:getInfo',
});
```

## Request resource action

```ts
api.resource('collection', collectionId)[action]();
api.resource('collection.association', collectionId)[action]();
```
