---
title: '@nocobase/test'
order: 7
---

# @nocobase/test

## mockDatabase

为 database 提供的测试套件，同时提供数据 mock（使用 mockjs）。

```ts
import { mockDatabase } from '@nocobase/test';

describe('test', () => {
  let db;

  beforeEach(async () => {
    db = mockDatabase({});
    db.table({
      name: 'examples',
      fields: [{
        name: 'name',
        type: 'string',
        mock: {
          "1-10": "★"
        },
      }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('test model', () => {
    const Test = db.getModel('tests');
    Test.mockCreate({});
    Test.mockBulkCreate([{}]);
  });
});
```

## mockServer

为 server 提供的测试套件

```ts
import { mockServer } from '@nocobase/test';

describe('test', () => {
  let api;

  beforeEach(async () => {
    api = mockServer({});
    await api.database.sync();
  });

  afterEach(async () => {
    await api.database.close();
  });

  it('test resource', () => {
    await api.resource('demos').get();
  });

  it('test request', () => {
    await api.request().get('/');
  });
});
```
