---
title: "nb app logs"
description: "nb app logs コマンドリファレンス：指定した env の NocoBase アプリケーションログを表示します。"
keywords: "nb app logs,NocoBase CLI,アプリケーションログ,Docker logs,pm2 logs"
---

# nb app logs

アプリケーションのログを表示します。npm/Git インストールでは pm2 のログを読み取り、Docker インストールでは Docker コンテナのログを読み取ります。

## 使い方

```bash
nb app logs [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | ログを表示する CLI env 名。省略時は現在の env を使用します |
| `--tail` | integer | フォロー前に表示する最新ログの行数。デフォルトは `100` です |
| `--follow`, `-f` / `--no-follow` | boolean | 新しいログを継続的にフォローするかどうか |

## 使用例

```bash
nb app logs
nb app logs --env app1
nb app logs --env app1 --tail 200
nb app logs --env app1 --no-follow
```

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app restart`](./restart.md)
- [`nb db logs`](../db/logs.md)
