---
title: "nb proxy nginx"
description: "nb proxy nginx コマンドグループリファレンス: Nginx provider の driver、設定生成、実行制御を管理します。"
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` は Nginx provider のコマンドグループ入口です。

サイト、証明書、キャッシュ、アクセス制御をすでに Nginx で管理しているなら、通常はここから始めます。主に 2 つのことを扱います。

- Nginx を `local` または `docker` のどちらで動かすかを選ぶこと
- CLI 管理 env 向けの Nginx エントリを生成し、起動し、再読み込みし、状態を確認すること

## 使い方

```bash
nb proxy nginx <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Nginx driver を切り替える |
| [`nb proxy nginx current`](./current.md) | 現在の driver を出力する |
| [`nb proxy nginx generate`](./generate.md) | 指定 env の Nginx 設定を生成または更新する |
| [`nb proxy nginx start`](./start.md) | Nginx proxy を起動する |
| [`nb proxy nginx restart`](./restart.md) | Nginx proxy を再起動する |
| [`nb proxy nginx reload`](./reload.md) | Nginx 設定を再読み込みする |
| [`nb proxy nginx stop`](./stop.md) | Nginx proxy を停止する |
| [`nb proxy nginx status`](./status.md) | Nginx の実行状態を表示する |
| [`nb proxy nginx info`](./info.md) | driver、設定パス、実行情報を表示する |

## 注意

- 現在の driver は `proxy.nginx-driver` に保存されます
- デフォルト driver は `local` です
- ローカル driver は `bin.nginx` が指す実行ファイルを使い、デフォルト値は `nginx` です
- Docker driver は `nginx:latest` を使います
- Docker コンテナ名のデフォルトは `<docker.container-prefix>-nginx-proxy` です
- Docker driver はホストの `NB_CLI_ROOT` をコンテナ内の `/apps` にマウントします

## 典型的な流れ

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## 関連コマンド

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
