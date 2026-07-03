---
title: "nb config"
description: "nb config リファレンス: NocoBase CLI のデフォルト設定値を管理します。"
keywords: "nb config,NocoBase CLI,configuration,default configuration"
---

# nb config

CLI のデフォルト設定値を管理します。現在サポートされているキーは主に次のように分類されます。

- CLI 自体: `locale`, `update.policy`, `license.pkg-url`
- Docker ランタイム: `docker.network`, `docker.container-prefix`
- 外部実行ファイル: `bin.docker`, `bin.caddy`, `bin.git`, `bin.nginx`, `bin.pnpm`, `bin.yarn`
- プロキシ生成: `proxy.nb-cli-root`, `proxy.upstream-host`, `proxy.nginx-driver`, `proxy.caddy-driver`

ほとんどのプロジェクトで必要になるのは、その一部だけです。実際によく使うのは次のキーです。

- `update.policy`
- `docker.network`
- `docker.container-prefix`
- `bin.nginx` または `bin.caddy`
- `proxy.nginx-driver` または `proxy.caddy-driver`

## よく使う設定キー

| キー | デフォルト | 説明 |
| --- | --- | --- |
| `locale` | 現在の CLI ルールに従って解決 | CLI が使用する言語を上書きします |
| `update.policy` | `prompt` | 起動時の更新ポリシー: `prompt`, `auto`, `off` |
| `license.pkg-url` | `https://pkg.nocobase.com/` | 商用拡張パッケージのダウンロード URL を上書きします |
| `docker.network` | `nocobase` | CLI 管理の Docker アプリで使用するデフォルトネットワーク |
| `docker.container-prefix` | `nb` | CLI 管理の Docker コンテナで使用するデフォルトプレフィックス |
| `bin.docker` | `docker` | Docker 実行ファイルのパスを上書きします |
| `bin.caddy` | `caddy` | Caddy 実行ファイルのパスを上書きします |
| `bin.git` | `git` | Git 実行ファイルのパスを上書きします |
| `bin.nginx` | `nginx` | Nginx 実行ファイルのパスを上書きします |
| `bin.pnpm` | `pnpm` | pnpm 実行ファイルのパスを上書きします |
| `bin.yarn` | `yarn` | Yarn 実行ファイルのパスを上書きします |
| `proxy.nb-cli-root` | CLI ルート。通常は現在のユーザーのホームディレクトリ | プロキシプロセスと CLI が同じファイルシステムルートを見ていない場合に、生成されるプロキシ設定から見えるルートパスを上書きします |
| `proxy.upstream-host` | `127.0.0.1` | プロキシが NocoBase アプリへトラフィックを転送する際に使うホストを上書きします |
| `proxy.nginx-driver` | `local` | `nb proxy nginx` が使用するデフォルトランタイムドライバ |
| `proxy.caddy-driver` | `local` | `nb proxy caddy` が使用するデフォルトランタイムドライバ |

## 使い方

```bash
nb config <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb config get`](./get.md) | 設定キーの実効値を読み取ります |
| [`nb config set`](./set.md) | 設定キーを設定します |
| [`nb config delete`](./delete.md) | 明示的に設定された設定キーを削除します |
| [`nb config list`](./list.md) | 現在明示的に設定されている設定キーを一覧表示します |

## 例

```bash
nb config list
nb config get update.policy
nb config set update.policy auto
nb config get proxy.nb-cli-root
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set proxy.nginx-driver docker
nb config set proxy.caddy-driver local
nb config get docker.network
nb config set docker.network nocobase
nb config set bin.nginx /usr/sbin/nginx
nb config set bin.git /usr/bin/git
nb config set bin.pnpm /usr/local/bin/pnpm
nb config delete docker.container-prefix
```

## 注意

- `bin.nginx` と `bin.caddy` は、`nb proxy nginx` および `nb proxy caddy` の `local` ドライバにのみ影響します
- `bin.pnpm` は、pnpm を直接実行する必要があるコマンドで使われます。たとえば pnpm 管理のグローバル CLI インストールを `nb self update` で更新する場合です
- `proxy.nginx-driver` と `proxy.caddy-driver` は、それぞれの provider が使用するデフォルトドライバを保存します
- `proxy.nb-cli-root` と `proxy.upstream-host` は高度なプロキシ上書き設定です。ほとんどの CLI 管理 `local` / `docker` env ではデフォルト値のままで十分です
- アクティブなプロキシドライバを切り替えたいだけなら、設定キーを直接書き換えるより `nb proxy nginx use` や `nb proxy caddy use` を使う方が通常は分かりやすいです

## 関連コマンド

- [`nb init`](../init.md)
- [`nb proxy`](../proxy/index.md)
- [`nb license`](../license/index.md)
