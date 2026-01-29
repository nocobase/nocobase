---
title: "Update Records: Write Data"
description: "Use ctx.api.request to send write requests (POST/PUT/PATCH/DELETE) to update records."
---

# Update Records: Write Data

Use `ctx.api.request()` to send write requests to update backend data.

## Create a record

```ts
// Create a record
const response = await ctx.api.request({
  method: 'post',
  url: '/posts:create',
  data: {
    title: 'Hello NocoBase',
    status: 'published',
  },
});

return response.data;
```

## Update a record

```ts
// Update a record by primary key
const response = await ctx.api.request({
  method: 'post',
  url: '/posts:update',
  data: {
    filterByTk: postId,
    values: {
      title: 'Updated title',
    },
  },
});

return response.data;
```
