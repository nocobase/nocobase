---
title: "本地存储：使用 api.storage 保存状态"
description: "通过 ctx.api.storage 在本地存储中读写带前缀的键值。"
---

# 本地存储：使用 api.storage 保存状态

`ctx.api.storage` 是对 `localStorage` 的一层封装，会自动带上应用前缀，避免键名冲突。

## 写入数据

```ts
// 保存当前选中的空间 ID
ctx.api.storage.setItem('CURRENT_SPACE', spaceId);
```

## 读取数据

```ts
const spaceId = ctx.api.storage.getItem('CURRENT_SPACE');
if (!spaceId) {
  // 还没有选择空间
}
```

## 删除数据

```ts
ctx.api.storage.removeItem('CURRENT_SPACE');
```

> 提示：实际保存到浏览器时，键名会加上前缀，例如 `NOCOBASE_CURRENT_SPACE`，无需手动处理。
