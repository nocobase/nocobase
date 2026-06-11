---
title: "nb proxy"
description: "nb proxy コマンドグループリファレンス: Nginx または Caddy provider を選び、CLI 管理 env の reverse proxy entrypoint を管理します。"
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,proxy configuration"
---

# nb proxy

NocoBase CLI において、`nb proxy` は reverse proxy 管理の統一された入り口です。

CLI は env 管理と entry layer 管理を分離しています。

- `nb env` はアプリケーション env を保存・管理します
- `nb proxy` はそれらの CLI 管理 env に対する Nginx または Caddy の entrypoint を生成・管理します

アプリがすでに CLI 管理 env として保存されていて、その env が `local` または `docker` であるなら、通常は provider のサブコマンドを 1 つ選ぶだけで十分です。

## 使い方

```bash
nb proxy <provider> <command>
```

## コマンドツリー

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Provider

| やりたいこと | 参照先 |
| --- | --- |
| サイト、証明書、キャッシュ、アクセス制御に引き続き Nginx を使いたい | [`nb proxy nginx`](./nginx/index.md) |
| HTTPS を素早く有効化し、TLS の細かい管理を減らしたい | [`nb proxy caddy`](./caddy/index.md) |
| `app-port` や `app-public-path` のように proxy の結果へ影響する env 設定を調整したい | [`nb env update`](../env/update.md) |

## 注意

- `nb proxy` 自体には独立した flag はありません
- entrypoint の生成と管理には `nb proxy nginx` または `nb proxy caddy` を使います
- どちらの provider も、現在のマシンから runtime に到達できる管理対象 env、つまり `local` または `docker` に対してのみ動作します
- どちらの provider も `local` と `docker` の 2 種類の driver をサポートします
- `use` はデフォルト driver を保存し、`current` は現在の driver をそのまま表示します
- `generate` は entry 設定ファイルを書き出すか更新するだけで、proxy プロセスを自動起動しません
- `start`, `restart`, `reload`, `stop`, `status`, `info` はいずれも現在の driver の runtime に対して動作します
- `nb env update` で `app-port` や `app-public-path` のような設定を変更した場合、通常は対応する `generate` コマンドを再実行する必要があります
- このコマンドグループは、リモート API 接続しか持たない env や SSH env には現在対応していません

## 典型的な流れ

```bash
# 1. provider と runtime driver を選ぶ
nb proxy nginx use docker

# 2. CLI 管理 env 用の entry 設定を生成する
nb proxy nginx generate --env app1 --host app1.example.com

# 3. proxy を起動する
nb proxy nginx start

# 4. 状態とパス情報を確認する
nb proxy nginx status
nb proxy nginx info

# 5. 設定変更後に reload する
nb proxy nginx reload
```

Caddy を使う場合は、上のコマンド内の `nginx` を `caddy` に置き換えてください。

## 各コマンドの違い

| コマンド | 役割 |
| --- | --- |
| `use` | 現在の provider のデフォルト driver を切り替える |
| `current` | `local` や `docker` など、現在の provider driver を表示する |
| `generate` | 1 つの env 用の proxy entry ファイルを生成または更新する |
| `start` | 現在の driver で proxy を起動する |
| `reload` | サービスを止めずに設定を再読み込みする |
| `restart` | いったん停止してから再起動する |
| `stop` | proxy を停止する |
| `status` | runtime の状態を表示する |
| `info` | driver、config file path、runtime root、upstream host、および関連する runtime 情報を表示する |

## 例

```bash
# 1 つの env 用に Nginx を生成して起動する
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# 1 つの env 用に Caddy を生成して起動する
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## 関連コマンド

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
