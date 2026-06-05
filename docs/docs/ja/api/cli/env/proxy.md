---
title: 'nb env proxy'
description: 'nb env proxy コマンドリファレンス：CLI が管理する env 向けに Nginx または Caddy のプロキシ設定を生成します。'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,プロキシ設定'
---

# nb env proxy

NocoBase CLI の `nb env proxy` は、CLI が管理する 1 つの env 向けにリバースプロキシ設定を生成します。通常は `nginx` を使えば十分です。すでに Caddy を使っている場合や、Caddyfile が必要な場合だけ `caddy` に切り替えてください。

このコマンドは、現在のマシンから runtime に到達できる管理対象 env、つまり `local` または `docker` に対してのみ使えます。リモート API 接続しか持たない env や SSH env は、今のところサポートしていません。

## 使い方

```bash
nb env proxy [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | プロキシ設定を生成する対象の設定済み env 名。省略した場合は現在の env を使います |
| `--output`, `-o` | string | 出力ファイルパス。デフォルトは `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` です |
| `--provider` | string | プロキシ provider。`nginx` または `caddy` |
| `--host` | string | エントリ設定に書き込むホスト名。`example.com` や `localhost` など |
| `--port` | string | エントリ設定に書き込むポート。これはプロキシの入口ポートであり、上流の NocoBase アプリのポートではありません |
| `--install` | boolean | 共有プロキシ設定を provider のメイン設定に組み込みます |
| `--reload` | boolean | 設定を書き込んだあとに provider を検証して再読み込みします |
| `--print` | boolean | ファイルを書き込まず、生成結果を stdout に出力します |

## デフォルトの出力ファイル

`--output` を指定しない場合、CLI は `~/.nocobase/proxy/<provider>/` 配下で 3 種類のファイルを管理します。

| Provider | generated ファイル | 編集可能なエントリファイル | 共有メイン設定 |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

それぞれの役割は次のとおりです。

- `generated.*` は CLI の管理対象で、次に `nb env proxy` を実行すると上書きされます
- `app.conf` / `app.caddy` は編集可能なエントリファイルですが、CLI が管理する generated 設定への参照は残しておく必要があります
- `nocobase.conf` / `nocobase.caddy` は、すべての env のエントリファイルを取り込む共有メイン設定です

`--output` を指定した場合、CLI は generated 設定だけをそのファイルに書き込み、エントリファイルや共有メイン設定は作成・更新しません。

## 関連する設定項目

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `proxy.provider` | `nginx` | `nb env proxy` がデフォルトで使う provider |
| `proxy.nb-cli-root` | CLI root。通常は現在のユーザーのホームディレクトリ | `.nocobase` のパスを、プロキシプロセスから見える root パスに対応付けます |
| `proxy.upstream-host` | `127.0.0.1` | プロキシが NocoBase アプリへトラフィックを戻すときに使うホスト |
| `bin.caddy` | `caddy` | `--install` や `--reload` で使う Caddy 実行ファイルのパス |
| `bin.nginx` | `nginx` | `--install` や `--reload` で使う Nginx 実行ファイルのパス |

ほとんどの環境では `proxy.nb-cli-root` を変更する必要はありません。通常は、Nginx や Caddy が別コンテナ、別のマウント root、または別のパスの見え方で動いている場合にだけ必要になります。

## 説明

- `--port` には `1` から `65535` の整数を指定する必要があります
- 上流の NocoBase アプリのポートは `--port` ではなく、保存済み env の `appPort` から取得されます
- env に `appPort` がないと表示された場合は、先に `nb env update <name>` を実行するか、`nb env update <name> --app-port <port>` で明示的に保存してください
- `--print` は `--install` や `--reload` と同時には使えません
- `--output` は `--install` や `--reload` と同時には使えません
- `--install` は共有設定を provider のメイン設定に接続します。`--reload` は provider を検証して再読み込みします。実際にはこの 2 つのフラグを一緒に使うことが多いです

## 例

```bash
# 現在の env 用にデフォルトの nginx 設定を生成する
nb env proxy

# 特定の env 用に設定を生成する
nb env proxy demo

# ファイルを書き込まずに generated 設定を出力する
nb env proxy demo --print

# エントリ設定にホストとポートを書き込む
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Caddy 設定を生成する
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# デフォルト provider と upstream host を変更する
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# provider が別の root パスで動くときに .nocobase のパスを対応付ける
nb config set proxy.nb-cli-root /workspace

# 共有設定を provider のメイン設定に組み込み、再読み込みする
nb env proxy demo --install --reload
```

## 関連コマンド

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
