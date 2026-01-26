---
title: "Fetch User Profile"
description: "Use ctx.api.request to fetch user profile."
---

# Example

## Fetch User Profile

Use this snippet to fetch user profile.

```ts
const response = await ctx.api.request({
  method: 'get',
  url: '/users:get',
});
return response.data;
```

## Update User Profile

Use this snippet to update user profile.

```ts
const response = await ctx.api.request({
  method: 'post',
  url: '/users:update',
  data: payload,
});
return response.data;
```
