---
title: 'nb env proxy nginx'
description: 'nb env proxy nginx コマンドのリファレンスです。CLI 管理 env 向けに Nginx のプロキシ設定と補助ファイルを生成します。'
keywords: 'nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,プロキシ設定'
---

# nb env proxy nginx

`nb env proxy nginx` は、CLI 管理 env 向けに Nginx のプロキシ設定と補助ファイルを生成します。すでに Nginx でサイトを管理している場合や、証明書、キャッシュ、アクセス制御を引き続き自分で管理したい場合に向いています。

このコマンドは、現在のマシンから runtime に到達できる管理対象 env、つまり `local` または `docker` に対してのみ使えます。リモート API 接続だけの env や SSH env では現在サポートされていません。

## 使い方

```bash
nb env proxy nginx [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | プロキシ設定を生成する対象の設定済み env 名です。省略した場合は現在の env を使います |
| `--env`, `-e` | string | env 名を明示的に指定します。通常はこちらの形式がおすすめです |
| `--host` | string | エントリ設定に書き込むホスト名です。`example.com` や `localhost` などを指定します |
| `--port` | string | エントリ設定に書き込むポートです。これはプロキシの入口ポートであり、上流の NocoBase アプリのポートではありません |
| `--install` | boolean | 共有プロキシ設定を Nginx のメイン設定に組み込みます |
| `--reload` | boolean | ファイルを書き込んだあとに Nginx を検証して再読み込みします |
| `--print` | boolean | ファイルを書き込まず、レンダリングした `app.conf` をそのまま表示します |

## デフォルトの出力

`nb env proxy nginx` は `~/.nocobase/proxy/nginx/` の下で次のファイルを管理します。

| ファイル | 役割 |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | 編集可能なサイトのエントリファイルです。CLI はその中の managed ブロックを更新し、その前後にサイト固有の設定を追加できます |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | 現在アクティブな client の `index.html` から生成される v1 SPA 用のフォールバックページです |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | 現在アクティブな client の `v/index.html` から生成される v2 SPA 用のフォールバックページです |
| `~/.nocobase/proxy/nginx/nocobase.conf` | すべての env の `app.conf` を取り込む共有メイン設定です |
| `~/.nocobase/proxy/nginx/snippets/` | 組み込みテンプレートからコピーされる共有 snippets ディレクトリです |

ポイントは次のとおりです。

- `app.conf` は編集できますが、`# BEGIN NocoBase managed config` と `# END NocoBase managed config` の間にある managed ブロックは残しておく必要があります
- `index-v1.html` と `index-v2.html` は、現在の env のサブパス、アクティブな client バージョン、`CDN_BASE_URL` に合わせて asset URL を自動で書き換えます
- `nocobase.conf` は主に `--install` で使われます
- `public/` と `snippets/` の下にあるファイルは通常手動編集の対象ではなく、次回コマンド実行時に再同期されます

:::warning 注意

サイト固有の Nginx 設定を追加したい場合は `app.conf` を編集してください。`public/` や `snippets/` の managed ファイルは、次に `nb env proxy nginx` を実行したときに上書きされるため、手動では編集しないでください。

:::

## 関連する設定項目

生成される Nginx 出力に直接影響する CLI 設定項目は次のとおりです。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI root。通常は現在のユーザーのホームディレクトリです | `.nocobase` のパスを、Nginx から見える root パスに対応付けます |
| `proxy.upstream-host` | `127.0.0.1` | プロキシが NocoBase アプリへトラフィックを戻すときに使うホストです |
| `bin.nginx` | `nginx` | `--install` や `--reload` で使う Nginx 実行ファイルのパスです |

ほとんどの環境では `proxy.nb-cli-root` を変更する必要はありません。通常必要になるのは、Nginx が別コンテナ、別のマウント root、または別のパスの見え方で動いている場合だけです。

## 注意点

- `--port` には `1` から `65535` の整数を指定する必要があります
- 上流の NocoBase アプリのポートは `--port` ではなく、保存済み env の `appPort` から取得されます
- env に `appPort` がないと表示された場合は、先に `nb env update <name>` を実行するか、`nb env update <name> --app-port <port>` で明示的に保存してください
- `nb env update` で `app-port` や `app-public-path` のような設定を変更した場合は、そのあとで `nb env proxy nginx` を通常もう一度実行する必要があります
- `--print` は `--install` や `--reload` と同時には使えません
- Nginx provider では `--output` はサポートされていません

## 例

```bash
# 現在の env 用に Nginx 設定を生成
nb env proxy nginx

# 特定の env 用に設定を生成
nb env proxy nginx --env demo

# 公開ホストとポートをエントリ設定に書き込む
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# ファイルを書き込まずにレンダリングした app.conf を表示
nb env proxy nginx --env demo --print

# Nginx が別のマウント root で動くときに .nocobase のパスを対応付ける
nb config set proxy.nb-cli-root /workspace

# 共有設定を Nginx のメイン設定に組み込み、すぐに再読み込みする
nb env proxy nginx --env demo --install --reload
```

## 関連コマンド

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
