---
title: Actions - 操作方法
group: 
  order: 2
  title: 概念
---

# Actions - 操作方法

resourcer 提供了 registerActionHandlers 用于自定义 action

全局 action

某 resource 特有

```ts
export async function foo(ctx, next) {

}

export const bar = {}
```
