---
title: "nb source test"
description: "nb source test コマンドリファレンス：選択したアプリケーションディレクトリでテストを実行し、組み込みテストデータベースを自動準備します。"
keywords: "nb source test,NocoBase CLI,テスト,Vitest,データベース"
---

# nb source test

選択したアプリケーションディレクトリでテストを実行します。テスト実行前に、CLI は組み込み Docker テストデータベースを再作成し、内部で使用する `DB_*` 環境変数を注入します。

## 使い方

```bash
nb source test [paths...] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[paths...]` | string[] | テストランナーに渡すテストファイルパスまたは glob |
| `--cwd`, `-c` | string | テストを実行するアプリケーションディレクトリ。デフォルトは現在のディレクトリです |
| `--watch`, `-w` | boolean | Vitest を watch モードで実行します |
| `--run` | boolean | 1 回のみ実行し、watch モードには入りません |
| `--allowOnly` | boolean | `.only` テストを許可します |
| `--bail` | boolean | 最初の失敗で停止します |
| `--coverage` | boolean | カバレッジレポートを有効にします |
| `--single-thread` | string | 内部テストランナーに single-thread モードを渡します |
| `--server` | boolean | サーバーサイドテストモードを強制します |
| `--client` | boolean | クライアントサイドテストモードを強制します |
| `--db-clean`, `-d` | boolean | 内部アプリケーションコマンドがサポートしている場合にデータベースをクリーンアップします |
| `--db-dialect` | string | 組み込みテストデータベースの種類：`postgres`、`mysql`、`mariadb`、`kingbase` |
| `--db-image` | string | 組み込みテストデータベースの Docker イメージ |
| `--db-port` | string | 組み込みテストデータベースがホストに公開する TCP ポート |
| `--db-database` | string | テストに注入するデータベース名 |
| `--db-user` | string | テストに注入するデータベースユーザー |
| `--db-password` | string | テストに注入するデータベースパスワード |
| `--verbose` | boolean | 内部の Docker およびテストランナーの出力を表示します |

## 使用例

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## 関連コマンド

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
