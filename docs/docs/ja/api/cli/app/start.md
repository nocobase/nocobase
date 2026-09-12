---
title: "nb app start"
description: "nb app start コマンドリファレンス：指定した env の NocoBase アプリケーションを起動します。必要に応じて、CLI はまず現在のライセンスで利用が許可されている商用プラグインを同期し、その後ローカル env では起動前に必要なインストールまたはアップグレード準備を自動実行し、Docker env では保存済み設定からアプリケーションコンテナを再作成します。"
keywords: "nb app start,NocoBase CLI,アプリケーション起動,Docker,pm2"
---

# nb app start

指定した env の NocoBase アプリケーションを起動します。必要に応じて、CLI はまず現在のライセンスで利用が許可されている商用プラグインを同期します。その後、npm/Git インストールではローカルアプリケーションコマンドを実行する前に、必要なインストールまたはアップグレード準備を自動実行し、Docker インストールでは保存済みの env 設定からアプリケーションコンテナを再作成します。

## 使い方

```bash
nb app start [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 起動する CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--verbose` | boolean | 内部のローカルまたは Docker コマンド出力を表示します |

## 使用例

```bash
nb app start
nb app start --env local
nb app start --env local --verbose
nb app start --env local-docker
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

デフォルトでは、必要に応じて CLI はまず `nb license plugins sync --skip-if-no-license` を実行し、現在のライセンスで利用が許可されている商用プラグインを同期します。その後、ローカル env はバックグラウンドで起動する前に必要なインストールまたはアップグレード準備を自動実行し、Docker env は保存済みの env 設定からアプリケーションコンテナを再作成します。CLI がアプリケーションの準備完了を待つ必要がある場合は、`__health_check` を確認します。最初に待機メッセージを 1 行出力し、その後は 10 秒ごとに進捗メッセージを 1 行ずつ出力し、アプリケーションが利用可能になるかタイムアウトするまで待機します。

## hook スクリプト

現在の env が `nb init --hook-script` で hook を保存している場合、`nb app start` はアプリが実際に起動し、`__health_check` に通った後で `afterAppStart(context)` を実行します。インストール済み env では `context.phase = 'app-start'`、`context.command = 'app:start'` になります。アプリがすでに実行中の場合、このコマンドは hook を実行しません。

`--prepare-only` で作成された prepared env では、初回の `nb app start` がまず `beforeAppInstall(context)` を実行し、初回インストールと起動を完了してから `afterAppStart(context)` を実行します。どちらの hook も `context.phase = 'init'`、`context.command = 'app:start'` を受け取ります。

## 関連コマンド

- [`nb app stop`](./stop.md)
- [`nb app restart`](./restart.md)
- [`nb app logs`](./logs.md)
