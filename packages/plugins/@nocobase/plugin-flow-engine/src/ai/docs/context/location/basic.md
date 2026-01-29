---
title: "Get Location"
description: "Use ctx.location.pathname to get location."
---

# Basic

## Get Location

Use this snippet to get location.

```ts
return ctx.location;
```

## Set Query

Use this snippet to set query.

```ts
ctx.router.navigate({
  pathname: ctx.location.pathname,
  search: params,
});
```
