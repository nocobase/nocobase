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
| `<key>`    | string | 設定項目名：`locale`、`update.policy`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git` または `bin.yarn` |

## 例

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete bin.git
```

## 関連コマンド

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
