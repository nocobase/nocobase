---
title: "nb source dev"
description: "nb source dev コマンドリファレンス：npm または Git ソースの env で NocoBase の開発モードを起動します。"
keywords: "nb source dev,NocoBase CLI,開発モード,ホットリロード"
---

# nb source dev

npm または Git ソースの env で開発モードを起動します。Docker env の場合は [`nb app logs`](../app/logs.md) で実行ログを確認してください。

## 使い方

```bash
nb source dev [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 開発モードに入る CLI env 名。省略時は現在の env を使用します |
| `--db-sync` | boolean | 開発モード起動前にデータベースを同期します |
| `--port`, `-p` | string | 開発サーバーのポート |
| `--client`, `-c` | boolean | クライアントのみ起動します |
| `--server`, `-s` | boolean | サーバーのみ起動します |
| `--inspect`, `-i` | string | サーバーの Node.js inspect デバッグポート |

## 使用例

```bash
nb source dev
nb source dev --env app1
nb source dev --env app1 --db-sync
nb source dev --env app1 --port 12000
nb source dev --env app1 --client
nb source dev --env app1 --server
nb source dev --env app1 --inspect 9229
```

## 関連コマンド

- [`nb source download`](./download.md)
- [`nb app start`](../app/start.md)
- [`nb app logs`](../app/logs.md)
