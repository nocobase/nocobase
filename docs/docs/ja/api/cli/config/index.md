---
title: 'nb config'
description: 'nb config コマンドリファレンス：NocoBase CLI のデフォルト設定項目を管理します。'
keywords: 'nb config,NocoBase CLI,設定,デフォルト設定'
---

# nb config

CLI のデフォルト設定を管理します。現在サポートされている設定項目は次のとおりです。

- `locale`
- `update.policy`
- `license.pkg-url`
- `docker.network`
- `docker.container-prefix`
- `bin.docker`
- `bin.caddy`
- `bin.git`
- `bin.nginx`
- `bin.yarn`
- `proxy.provider`
- `proxy.nb-cli-root`
- `proxy.upstream-host`

## よく使う設定項目

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `locale` | CLI の現在のルールに従って解決 | CLI が使用する言語を上書きします |
| `update.policy` | `prompt` | 起動時の更新ポリシー：`prompt`、`auto`、または `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | 商用拡張パッケージのダウンロード URL を上書きします |
| `docker.network` | `nocobase` | CLI が管理する Docker アプリケーションのデフォルトネットワーク |
| `docker.container-prefix` | `nb` | CLI が管理する Docker コンテナのデフォルト接頭辞 |
| `bin.docker` | `docker` | Docker 実行ファイルのパスを上書き |
| `bin.caddy` | `caddy` | Caddy 実行ファイルのパスを上書き |
| `bin.git` | `git` | Git 実行ファイルのパスを上書き |
| `bin.nginx` | `nginx` | Nginx 実行ファイルのパスを上書き |
| `bin.yarn` | `yarn` | Yarn 実行ファイルのパスを上書き |
| `proxy.provider` | `nginx` | `nb env proxy` がデフォルトで使うプロキシ provider です |
| `proxy.nb-cli-root` | CLI root。通常は現在のユーザーのホームディレクトリ | `.nocobase` のパスをプロキシプロセスから見える root パスに対応付けます |
| `proxy.upstream-host` | `127.0.0.1` | プロキシが NocoBase アプリへトラフィックを戻すときに使うホストです |

## 使い方

```bash
nb config <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb config get`](./get.md)       | 設定項目の有効値を読み取る                       |
| [`nb config set`](./set.md)       | 設定項目を設定する                               |
| [`nb config delete`](./delete.md) | 明示的に設定された項目を削除する                 |
| [`nb config list`](./list.md)     | 現在明示的に設定されている設定項目を一覧表示する |

## 例

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.provider
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config delete docker.container-prefix
```

## 関連コマンド

- [`nb init`](../init.md)
- [`nb license`](../license/index.md)
