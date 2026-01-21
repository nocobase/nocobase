---
title: "API request template"
description: "Basic template to send HTTP requests via ctx.api.request."
---

# API request template

Basic template to send HTTP requests via ctx.api.request

```ts
// Replace url/method/params/data as needed
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 10,
  },
});

ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), response?.data);
```
