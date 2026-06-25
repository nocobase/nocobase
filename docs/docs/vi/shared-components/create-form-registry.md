---
title: "createFormRegistry"
description: "createFormRegistry: Tạo registry nội bộ cho mục mở rộng plugin."
keywords: "createFormRegistry,NocoBase,client-v2"
---

# createFormRegistry

`createFormRegistry` dùng để tạo registry nội bộ cho mục mở rộng plugin.

## Cách dùng cơ bản

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

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `register(entry)` | `-` | Register an entry |
| `unregister(name)` | `-` | Remove an entry |
| `get(name)` | `-` | Get an entry by name |
| `has(name)` | `-` | Check whether an entry exists |
| `list()` | `-` | Return all entries |
