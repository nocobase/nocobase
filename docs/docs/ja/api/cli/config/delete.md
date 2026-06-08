---
title: 'nb config delete'
description: 'nb config delete コマンドリファレンス：明示的に設定された CLI 設定項目を削除します。'
keywords: 'nb config delete,NocoBase CLI,設定削除'
---

# nb config delete

明示的に設定された CLI 設定項目を削除します。削除後、その設定項目はデフォルト値に戻ります。

## 使用方法

```bash
nb config delete <key>
```

## パラメータ

| パラメータ | 型     | 説明                                                                                                                          |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `<key>` | string | 設定項目名。サポートされている値は [`nb config`](./index.md) を参照してください |

## 例

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.provider
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
```

## 関連コマンド

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
