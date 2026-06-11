---
title: "nb env update"
description: "nb env update コマンドリファレンス: 保存済みの API、認証、ソースコード、アプリケーション、データベース設定を更新します。"
keywords: "nb env update,NocoBase CLI,env configuration,authentication,database,source code"
---

# nb env update

`nb env update` は、保存済み env の設定を更新します。API アドレス、認証方式、ソースコードの取得元、ローカルアプリパス、公開パス、ポート、データベースパラメータなどを調整できます。更新が完了すると、CLI は変更内容に応じて必要な後続処理を自動的に行います。

設定パラメータを何も渡さない場合でも、CLI は現在の env 状態に基づいて再同期を実行します。

## 使い方

```bash
nb env update [name] [flags]
```

## 共通オプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | 更新する設定済み env 名。省略時は現在の env を使用します |
| `--verbose` | boolean | 詳細な進捗を表示します |

## API と認証オプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | `/api` プレフィックスを含む NocoBase API URL |
| `--auth-type` | string | 認証方式: `basic`, `token`, `oauth` |
| `--access-token`, `--token`, `-t` | string | `token` 認証で使用する API key または access token。保存すると認証方式も `token` に切り替わります |
| `--username` | string | `basic` 認証用に保存するユーザー名。現在の env がすでに `basic` を使っている場合、または `--auth-type basic` と一緒に使う場合のみ使用します |

## ソースとダウンロードのオプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `--source` | string | 保存済みアプリソース: `docker`, `git`, `local`, `npm` |
| `--download-version`, `--version` | string | 保存済みバージョン指定子: Docker tag、npm パッケージ版、または Git ref |
| `--docker-registry` | string | タグを含まない Docker イメージレジストリ名 |
| `--docker-platform` | string | Docker イメージプラットフォーム: `auto`, `linux/amd64`, `linux/arm64` |
| `--git-url` | string | Git リポジトリ URL |
| `--npm-registry` | string | npm または Git ダウンロード、および依存関係インストールに使用するレジストリ |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | npm / Git ソースで `devDependencies` をインストールするかどうか |
| `--build` / `--no-build` | boolean | npm / Git ダウンロード後に自動ビルドするかどうか |
| `--build-dts` / `--no-build-dts` | boolean | ビルド時に TypeScript declaration file を生成するかどうか |

## アプリケーションオプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `--app-path` | string | アプリケーションディレクトリ。ローカルアプリパスの管理には現在これを優先するのが推奨です |
| `--app-public-path` | string | アプリの公開パス (`APP_PUBLIC_PATH`)。例: `/` または `/nocobase/` |
| `--app-port` | string | アプリケーションの HTTP ポート |
| `--cdn-base-url` | string | クライアント静的アセット用 CDN ベース URL (`CDN_BASE_URL`) |
| `--app-key` | string | アプリケーションキー (`APP_KEY`) |
| `--timezone` | string | アプリケーションのタイムゾーン (`TZ`) |

## データベースオプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | CLI 管理の組み込みデータベースを使うかどうか |
| `--db-dialect` | string | データベース種別: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--builtin-db-image` | string | 組み込みデータベース用コンテナイメージ |
| `--db-host` | string | データベースホスト |
| `--db-port` | string | データベースポート |
| `--db-database` | string | データベース名 |
| `--db-user` | string | データベースユーザー名 |
| `--db-password` | string | データベースパスワード |
| `--db-schema` | string | データベーススキーマ。通常は PostgreSQL のみで使います |
| `--db-table-prefix` | string | テーブルプレフィックス |
| `--db-underscored` / `--no-db-underscored` | boolean | テーブル名とフィールド名をアンダースコア形式にするかどうか |

## 設定のクリア

| オプション | 型 | 説明 |
| --- | --- | --- |
| `--unset` | string[] | フラグ名を指定して保存済みフィールドを 1 つ以上クリアします。繰り返し指定することも、`--unset git-url,username` のようにカンマ区切りで渡すこともできます |

## 注意

:::tip

現在の env の最新状態に基づいて CLI に再同期させたいだけなら、追加オプションなしで `nb env update` または `nb env update <name>` を実行するだけで十分です。

:::

- 更新が完了すると、CLI は今回の変更内容に応じて必要な後続同期を自動的に処理します
- それ以外のオプションは保存済み env 設定だけを更新します。アプリケーションを自動で再起動したり、ローカルソースコードや Docker イメージを置き換えたりはしません
- `app-path`, `app-port`, `timezone`, `db-*` などを変更した場合、CLI は通常 `nb app restart --env <name>` の実行を案内します。変更が CLI 管理の組み込みデータベースに関わる場合は `nb app restart --env <name> --with-db` を案内します
- `app-port`, `app-public-path`, `cdn-base-url` など reverse proxy の結果に影響する設定を変更した場合、すでに生成済みプロキシ設定を使っているなら `nb proxy nginx generate` または `nb proxy caddy generate` を再実行してください
- `source`, `download-version`, `docker-registry`, `git-url`, `npm-registry` などのソース設定を更新しても、変更されるのは保存済み値だけです。既存のローカルソースコード、依存関係、イメージは自動では置き換えられません
- `--access-token` は `--auth-type basic` または `--auth-type oauth` と一緒には使えません
- 同じフィールドを `--unset` と明示的な値の両方で同時に指定することはできません。たとえば `--unset git-url` と `--git-url ...` を同時に使わないでください
- 認証方式を `basic` や `oauth` に切り替えた場合、または token をクリアした場合は、通常その後に `nb env auth <name>` を実行する必要があります

## 例

```bash
# 現在の env を保存済みの最新状態に基づいて再同期する
nb env update

# 特定の env を再同期する
nb env update prod

# API URL を更新する
nb env update prod --api-base-url http://localhost:13000/api

# token を更新し、認証方式を token に切り替える
nb env update prod --access-token <token>

# basic 認証に切り替え、ユーザー名を保存し、後で nb env auth を実行する
nb env update prod --auth-type basic --username admin

# 保存済みソースとバージョンを更新するが、ローカルコードはまだ置き換えない
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# アプリポートとタイムゾーンを調整し、あとで再起動する
nb env update local --app-port 13080 --timezone Asia/Shanghai

# 公開パスを調整し、必要なら後でプロキシを再生成する
nb env update local --app-public-path /nocobase/

# クライアントアセット用 CDN ベース URL を保存する
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# 保存済みフィールドをクリアする
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## 関連コマンド

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
