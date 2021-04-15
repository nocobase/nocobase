---
title: Actions - 操作方法
group: 
  order: 2
  title: 概念
---

# Actions - 操作方法

与 resourcer.registerAction 用法一致

```ts
export async function get(ctx, next) {
  await next();
}

export const list = {
  filter,
  fields, // 初始化的参数
  async handler(ctx, next) {
    await next();
  }
}
```
