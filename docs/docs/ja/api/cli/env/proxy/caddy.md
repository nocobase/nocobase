---
title: 'nb env proxy caddy'
description: 'nb env proxy caddy コマンドのリファレンスです。CLI 管理 env 向けに Caddy のプロキシ設定を生成します。'
keywords: 'nb env proxy caddy,NocoBase CLI,caddy,reverse proxy,プロキシ設定'
---

# nb env proxy caddy

`nb env proxy caddy` は、CLI 管理 env 向けに Caddy のプロキシ設定を生成します。すでにドメインがあり、HTTPS をすばやく有効にしたい場合や、TLS の細かい管理をあまり自分で持ちたくない場合に向いています。

このコマンドは、現在のマシンから runtime に到達できる管理対象 env、つまり `local` または `docker` に対してのみ使えます。リモート API 接続だけの env や SSH env では現在サポートされていません。

## 使い方

```bash
nb env proxy caddy [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | プロキシ設定を生成する対象の設定済み env 名です。省略した場合は現在の env を使います |
| `--env`, `-e` | string | env 名を明示的に指定します。通常はこちらの形式がおすすめです |
| `--output`, `-o` | string | 出力ファイルパスです。生成された route 設定だけを書き込み、`app.caddy` や共有メイン設定は追加で作成しません |
| `--host` | string | エントリ設定に書き込むホスト名です。`example.com` や `localhost` などを指定します |
| `--port` | string | エントリ設定に書き込むポートです。これはプロキシの入口ポートであり、上流の NocoBase アプリのポートではありません |
| `--install` | boolean | 共有プロキシ設定を Caddy のメイン設定に組み込みます |
| `--reload` | boolean | ファイルを書き込んだあとに Caddy を検証して再読み込みします |
| `--print` | boolean | ファイルを書き込まず、生成された route 設定をそのまま表示します |

## デフォルトの出力

`--output` を指定しない場合、CLI は `~/.nocobase/proxy/caddy/` の下で次のファイルを管理します。

| ファイル | 役割 |
| --- | --- |
| `~/.nocobase/proxy/caddy/<env>/generated.caddy` | 実際の reverse proxy 設定です。CLI が管理し、実行のたびに上書きされます |
| `~/.nocobase/proxy/caddy/<env>/app.caddy` | 編集可能なサイトのエントリファイルです。ここにサイト固有の設定を追加できます |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | すべての env の `app.caddy` を import する共有メイン設定です |

ポイントは次のとおりです。

- `generated.caddy` は CLI が管理する前提のファイルなので、手動では編集しないでください
- `app.caddy` は編集できますが、CLI が挿入する managed import は残しておく必要があります
- `nocobase.caddy` は主に `--install` で使われます

:::warning 注意

サイト固有の Caddy 設定を追加したい場合は `app.caddy` を編集してください。`generated.caddy` は次に `nb env proxy caddy` を実行したときに上書きされます。

:::

`--output` を指定した場合、CLI は生成された設定だけをそのファイルに書き込み、`app.caddy` や共有メイン設定は作成・更新しません。

## 関連する設定項目

生成される Caddy 出力に直接影響する CLI 設定項目は次のとおりです。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI root。通常は現在のユーザーのホームディレクトリです | `.nocobase` のパスを、Caddy から見える root パスに対応付けます |
| `proxy.upstream-host` | `127.0.0.1` | プロキシが NocoBase アプリへトラフィックを戻すときに使うホストです |
| `bin.caddy` | `caddy` | `--install` や `--reload` で使う Caddy 実行ファイルのパスです |

ほとんどの環境では `proxy.nb-cli-root` を変更する必要はありません。通常必要になるのは、Caddy が別コンテナ、別のマウント root、または別のパスの見え方で動いている場合だけです。

## 注意点

- `--host` は重要です。Caddy はサイトアドレスを見て HTTPS を自動管理するかどうかを判断します。本番環境では、現在のサーバーをすでに指しているドメインを指定するようにしてください
- `--port` には `1` から `65535` の整数を指定する必要があります
- 上流の NocoBase アプリのポートは `--port` ではなく、保存済み env の `appPort` から取得されます
- env に `appPort` がないと表示された場合は、先に `nb env update <name>` を実行するか、`nb env update <name> --app-port <port>` で明示的に保存してください
- `nb env update` で `app-port` や `app-public-path` のような設定を変更した場合は、そのあとで `nb env proxy caddy` を通常もう一度実行する必要があります
- `--print` は `--install` や `--reload` と同時には使えません
- `--output` は `--install` や `--reload` と同時には使えません

## 例

```bash
# 現在の env 用に Caddy 設定を生成
nb env proxy caddy

# 特定の env 用に設定を生成
nb env proxy caddy --env demo

# 公開ホストとポートをエントリ設定に書き込む
nb env proxy caddy --env demo --host demo.local.nocobase.com --port 8080

# ファイルを書き込まずに生成された route 設定を表示
nb env proxy caddy --env demo --print

# 生成された route 設定を任意のファイルに書き込む
nb env proxy caddy --env demo --output ./generated.caddy

# Caddy が別のマウント root で動くときに .nocobase のパスを対応付ける
nb config set proxy.nb-cli-root /workspace

# 共有設定を Caddy のメイン設定に組み込み、すぐに再読み込みする
nb env proxy caddy --env demo --install --reload
```

## 関連コマンド

- [`nb env proxy`](./index.md)
- [`nb env proxy nginx`](./nginx.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
