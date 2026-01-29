---
title: "Connect Filter"
description: "Connect filter."
---

# Basic

## Connect Filter

Use this snippet to connect filter.

```ts
ctx.filterManager.addFilterConfig({
  filterId,
  targetId,
  filterPaths: ['status'],
  operator: '$eq',
});
```

## Refresh Targets

Use this snippet to refresh targets.

```ts
ctx.filterManager.refreshTargetsByFilter(filterId);
```
