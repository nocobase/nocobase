---
title: "createFormRegistry"
description: "createFormRegistry: Создать внутренний реестр для элементов расширения плагина."
keywords: "createFormRegistry,NocoBase,client-v2"
---

# createFormRegistry

`createFormRegistry` используется, чтобы создать внутренний реестр для элементов расширения плагина.

## Базовое использование

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

| Параметр | Тип | Описание |
| --- | --- | --- |
| `register(entry)` | `-` | Register an entry |
| `unregister(name)` | `-` | Remove an entry |
| `get(name)` | `-` | Get an entry by name |
| `has(name)` | `-` | Check whether an entry exists |
| `list()` | `-` | Return all entries |
