---
title: "nb proxy caddy"
description: "nb proxy caddy コマンドグループリファレンス: Caddy provider の driver、設定生成、実行制御を管理します。"
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` は Caddy provider のコマンドグループ入口です。

すでにドメインがあり、HTTPS を素早く有効化したく、TLS の細かい管理をあまり自分で行いたくないなら、通常はここから始めます。主に 2 つのことを扱います。

- Caddy を `local` または `docker` のどちらで動かすかを選ぶこと
- CLI 管理 env 向けの Caddy エントリを生成し、起動し、再読み込みし、状態を確認すること

## 使い方

```bash
nb proxy caddy <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Caddy driver を切り替える |
| [`nb proxy caddy current`](./current.md) | 現在の driver を出力する |
| [`nb proxy caddy generate`](./generate.md) | 指定 env の Caddy 設定を生成または更新する |
| [`nb proxy caddy start`](./start.md) | Caddy proxy を起動する |
| [`nb proxy caddy restart`](./restart.md) | Caddy proxy を再起動する |
| [`nb proxy caddy reload`](./reload.md) | Caddy 設定を再読み込みする |
| [`nb proxy caddy stop`](./stop.md) | Caddy proxy を停止する |
| [`nb proxy caddy status`](./status.md) | Caddy の実行状態を表示する |
| [`nb proxy caddy info`](./info.md) | driver、設定パス、実行情報を表示する |

## 注意

- 現在の driver は `proxy.caddy-driver` に保存されます
- デフォルト driver は `local` です
- ローカル driver は `bin.caddy` が指す実行ファイルを使い、デフォルト値は `caddy` です
- Docker driver は `caddy:latest` を使います
- Docker コンテナ名のデフォルトは `<docker.container-prefix>-caddy-proxy` です
- Docker driver はホストの `NB_CLI_ROOT` をコンテナ内の `/apps` にマウントします

## 典型的な流れ

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## 関連コマンド

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
