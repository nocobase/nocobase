---
title: "createFormRegistry"
description: "createFormRegistry：创建插件内部的命名注册表。"
keywords: "createFormRegistry,注册表,扩展点,client-v2,NocoBase"
---

# createFormRegistry

`createFormRegistry` 用来创建一个轻量注册表。它适合插件内部有「同名、同形、不同实现」的扩展项，比如存储类型、认证方式、消息发送通道。

比起直接用 `Map`，它多了 namespace 标识、重复注册提示，以及更固定的 API。

## 基本用法

```ts
import { createFormRegistry, type FormRegistryEntry } from '@nocobase/client-v2';

interface StorageType extends FormRegistryEntry {
  title: string;
  Component: React.ComponentType;
}

const storageTypes = createFormRegistry<StorageType>('file-manager/storage-types');

storageTypes.register({ name: 'local', title: 'Local', Component: LocalStorageForm });
storageTypes.register({ name: 's3', title: 'Amazon S3', Component: S3StorageForm });

const s3 = storageTypes.get('s3');
const all = storageTypes.list();
```

## API

每个 entry 至少需要有 `name: string`。

| 方法 | 说明 |
| --- | --- |
| `register(entry)` | 注册一条记录 |
| `unregister(name)` | 删除一条记录 |
| `get(name)` | 按 name 获取记录 |
| `has(name)` | 判断是否存在 |
| `list()` | 返回所有记录 |

重复 `name` 会覆盖旧值，并输出 `console.warn`。这对 HMR 友好，开发期也能看到意外的重复注册。

## 什么时候用

适合用：

- 插件需要暴露内部扩展点
- 扩展项有统一结构
- 调用方只需要按 `name` 查找或渲染

不适合用：

- 只是页面里的临时状态
- 扩展项强绑定业务流程，外部插件不会复用
- 需要权限、排序、生命周期等复杂管理能力
