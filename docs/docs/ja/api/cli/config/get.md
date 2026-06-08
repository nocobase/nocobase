---
title: 'nb config get'
description: 'nb config get コマンドリファレンス：CLI 設定項目の有効値を読み取ります。'
keywords: 'nb config get,NocoBase CLI,設定の読み取り'
---

# nb config get

指定した CLI 設定項目の有効値を読み取ります。明示的に設定されていない場合は、デフォルト値を返します。

## 使用法

```bash
nb config get <key>
```

## パラメータ

| パラメータ | 型     | 説明                                                                                                                          |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `<key>` | string | 設定項目名。サポートされている値は [`nb config`](./index.md) を参照してください |

## 例

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get proxy.provider
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## 関連コマンド

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
