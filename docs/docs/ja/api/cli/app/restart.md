---
title: "nb app restart"
description: "nb app restart コマンドリファレンス：指定した env の NocoBase アプリケーションを再起動します。ローカル env では再起動中に必要なインストールまたはアップグレード準備を自動実行し、Docker env では保存済み設定からアプリケーションコンテナを再作成します。"
keywords: "nb app restart,NocoBase CLI,アプリケーション再起動,Docker"
---

# nb app restart

指定した env の NocoBase アプリケーションを停止してから再起動します。ローカル env では `nb app stop` と `nb app start` のフローを再利用し、再度起動する前に必要なインストールまたはアップグレード準備を自動実行します。Docker env では現在のコンテナを削除してから、保存済みの env 設定に基づいてアプリケーションコンテナを再作成します。

## 使い方

```bash
nb app restart [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 再起動する CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--daemon`, `-d` / `--no-daemon` | boolean | 停止後にデーモンモードで実行するかどうか。デフォルトは有効です |
| `--verbose` | boolean | 内部の停止・起動コマンド出力を表示します |

## 使用例

```bash
nb app restart
nb app restart --env local
nb app restart --env local --no-daemon
nb app restart --env local --verbose
nb app restart --env local-docker
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

デフォルトでは、ローカル env は再度起動する前に必要なインストールまたはアップグレード準備を自動実行します。CLI がアプリケーションの準備完了を待つ必要がある場合は、`__health_check` を確認します。最初に待機メッセージを 1 行出力し、その後は 10 秒ごとに進捗メッセージを 1 行ずつ出力し、アプリケーションが利用可能になるかタイムアウトするまで待機します。ローカル env に `--no-daemon` を指定すると、アプリケーションはフォアグラウンドで実行されるため、CLI は起動後に readiness チェックを待ち続けません。

## 関連コマンド

- [`nb app start`](./start.md)
- [`nb app stop`](./stop.md)
- [`nb app logs`](./logs.md)
