---
title: "nb db logs"
description: "nb db logs コマンドリファレンス：指定した env の組み込みデータベースコンテナのログを表示します。"
keywords: "nb db logs,NocoBase CLI,データベースログ,Docker logs"
---

# nb db logs

指定した env の組み込みデータベースコンテナのログを表示します。このコマンドは CLI 管理の組み込みデータベースが有効な env でのみ使用できます。

## 使い方

```bash
nb db logs [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 組み込みデータベースのログを表示する CLI env 名。省略時は現在の env を使用します |
| `--tail` | integer | フォロー前に表示する最新ログの行数。デフォルトは `100` です |
| `--follow`, `-f` / `--no-follow` | boolean | 新しいログを継続的にフォローするかどうか |

## 使用例

```bash
nb db logs
nb db logs --env app1
nb db logs --env app1 --tail 200
nb db logs --env app1 --no-follow
```

## 関連コマンド

- [`nb db ps`](./ps.md)
- [`nb app logs`](../app/logs.md)
