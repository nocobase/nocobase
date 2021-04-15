---
title: 如何编写测试
order: 4
toc: menu
---

# 如何编写测试

NocoBase 提供了 @nocobase/test 用于编写和调试插件。

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
    await app.resource('demos').get();
  });

  it('test request', () => {
    await app.request().get('/');
  });
});
```
