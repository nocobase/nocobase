---
title: "nb env info"
description: "nb env info コマンドリファレンス：指定した NocoBase CLI env のアプリケーション、データベース、API、認証設定を表示します。"
keywords: "nb env info,NocoBase CLI,環境詳細,設定"
---

# nb env info

単一の env の詳細情報を表示します。アプリケーション、データベース、API、認証の設定が含まれます。

## 使い方

```bash
nb env info [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | 表示する CLI env 名。省略時は現在の env を使用します |
| `--env`, `-e` | string | 表示する CLI env 名。位置引数と二者択一です |
| `--json` | boolean | JSON で出力します |
| `--show-secrets` | boolean | token やパスワードなどのシークレットを平文で表示します |

`[name]` と `--env` を同時に指定する場合は、両者が一致する必要があります。

## 使用例

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## 関連コマンド

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
