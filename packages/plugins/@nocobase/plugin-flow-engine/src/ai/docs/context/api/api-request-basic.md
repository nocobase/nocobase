---
title: "Basic Requests: Get User Info"
description: "Use ctx.api.request to send GET/POST requests to fetch or update user info."
---

# Basic Requests: Get User Info

Use `ctx.api.request()` to send basic GET / POST requests.

## Get user info

```ts
// Get current user info
const response = await ctx.api.request({
  method: 'get',
  url: '/users:get', // resource-style URL
});

// Usually return the data field
return response.data;
```

## Update user info

```ts
// payload contains fields to update
const response = await ctx.api.request({
  method: 'post',
  url: '/users:update',
  data: payload,
});

return response.data;
```
