---
title: "nb app start"
description: "nb app start コマンドリファレンス：指定した env の NocoBase アプリケーションを起動します。ローカル env では起動前に必要なインストールまたはアップグレード準備を自動実行し、Docker env では保存済み設定からアプリケーションコンテナを再作成します。"
keywords: "nb app start,NocoBase CLI,アプリケーション起動,Docker,pm2"
---

# nb app start

指定した env の NocoBase アプリケーションを起動します。npm/Git インストールではローカルアプリケーションコマンドを実行する前に、必要なインストールまたはアップグレード準備を自動実行し、Docker インストールでは保存済みの env 設定からアプリケーションコンテナを再作成します。

## 使い方

```bash
nb app start [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 起動する CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--daemon`, `-d` / `--no-daemon` | boolean | デーモンモードで実行するかどうか。デフォルトは有効です |
| `--verbose` | boolean | 内部のローカルまたは Docker コマンド出力を表示します |

## 使用例

```bash
nb app start
nb app start --env local
nb app start --env local --daemon
nb app start --env local --no-daemon
nb app start --env local --verbose
nb app start --env local-docker
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

デフォルトでは、ローカル env はバックグラウンドで起動する前に必要なインストールまたはアップグレード準備を自動実行し、Docker env は保存済みの env 設定からアプリケーションコンテナを再作成します。CLI がアプリケーションの準備完了を待つ必要がある場合は、`__health_check` を確認します。最初に待機メッセージを 1 行出力し、その後は 10 秒ごとに進捗メッセージを 1 行ずつ出力し、アプリケーションが利用可能になるかタイムアウトするまで待機します。

ローカル env に `--no-daemon` を指定すると、アプリケーションはフォアグラウンドで実行されます。この場合、CLI は起動後に readiness チェックを待ち続けません。

## 関連コマンド

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
