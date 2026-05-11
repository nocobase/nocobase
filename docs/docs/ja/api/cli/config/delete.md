---
title: "nb config delete"
description: "nb config delete コマンドリファレンス：明示的に設定された CLI 設定を削除します。"
keywords: "nb config delete,NocoBase CLI,configuration"
---

# nb config delete

明示的に設定された CLI 設定を削除します。削除後、このキーはデフォルト値に戻ります。

## 使い方

```bash
nb config delete <key>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<key>` | string | 設定キー：`license.pkg-url`、`docker.network`、`docker.container-prefix` |

## 使用例

```bash
nb config delete license.pkg-url
nb config delete docker.network
nb config delete docker.container-prefix
```

## 関連コマンド

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
