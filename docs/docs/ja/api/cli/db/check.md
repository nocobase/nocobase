---
title: "nb db check"
description: "nb db check コマンドリファレンス：現在の env または明示的なデータベースフラグでデータベースに接続できるか確認します。"
keywords: "nb db check,NocoBase CLI,database connection"
---

# nb db check

データベースに接続できるか確認します。env に保存されたデータベース設定を再利用することも、明示的に `--db-*` フラグを渡すこともできます。

## 使い方

```bash
nb db check [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env からデータベース設定を読み込みます。省略した場合は、必要な `--db-*` フラグをすべて指定する必要があります |
| `--db-dialect` | string | データベース方言：`postgres`、`kingbase`、`mysql`、`mariadb` |
| `--db-host` | string | データベースのホスト名または IP アドレス |
| `--db-port` | string | データベースの TCP ポート |
| `--db-database` | string | データベース名 |
| `--db-user` | string | データベースのユーザー名 |
| `--db-password` | string | データベースのパスワード |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb db check --env app1
nb db check --env app1 --db-password new-secret --json
nb db check --db-dialect postgres --db-host 127.0.0.1 --db-port 5432 --db-database nocobase --db-user nocobase --db-password secret
```

## 補足

選択した env が CLI 管理の組み込みデータベースを使用している場合、CLI は確認を実行する前に実際の接続先アドレスを解決します。

## 関連コマンド

- [`nb db ps`](./ps.md)
- [`nb env info`](../env/info.md)
