---
title: 'nb env info'
description: 'nb env info コマンドリファレンス：指定した NocoBase CLI env のアプリ、データベース、API、認証設定を表示します。'
keywords: 'nb env info,NocoBase CLI,環境詳細,設定'
---

# nb env info

単一の env の詳細情報を表示します。アプリ、データベース、API、認証設定が含まれます。

## 使い方

```bash
nb env info [name] [flags]
```

## パラメータ

| パラメータ       | 型      | 説明                                                                                               |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `[name]`         | string  | 表示する設定済み環境名。省略時は現在の env を使用                                                  |
| `--json`         | boolean | JSON を出力                                                                                        |
| `--field`        | string  | ドット区切りのパスで 1 つのフィールドのみを返します。例: `app.url`、`app.appPath`、`api.auth.type` |
| `--show-secrets` | boolean | トークン、パスワードなどの秘密情報を平文で表示                                                     |

## 例

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## 関連コマンド

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
