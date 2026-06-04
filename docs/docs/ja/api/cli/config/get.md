---
title: "nb config get"
description: "nb config get コマンドリファレンス：CLI 設定キーの実際に使われる値を取得します。"
keywords: "nb config get,NocoBase CLI,configuration"
---

# nb config get

CLI 設定キーの有効値を取得します。明示的に設定された値がない場合は、デフォルト値が返されます。

## 使い方

```bash
nb config get <key>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<key>` | string | 設定キー：`locale`、`update.policy`、`license.pkg-url`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git`、`bin.yarn` |

## 使用例

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get bin.git
```

## 関連コマンド

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
