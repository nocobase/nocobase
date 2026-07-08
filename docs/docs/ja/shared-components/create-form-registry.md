---
title: "createFormRegistry"
description: "createFormRegistry: プラグイン拡張項目用の内部レジストリを作成する."
keywords: "createFormRegistry,NocoBase,client-v2"
---

# createFormRegistry

`createFormRegistry` は、プラグイン拡張項目用の内部レジストリを作成するためのコンポーネントです。

## 基本的な使い方

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

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `register(entry)` | `-` | エントリを登録する |
| `unregister(name)` | `-` | エントリを削除する |
| `get(name)` | `-` | name でエントリを取得する |
| `has(name)` | `-` | エントリが存在するか確認する |
| `list()` | `-` | すべてのエントリを返す |
