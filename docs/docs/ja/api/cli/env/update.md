---
title: 'nb env update'
description: 'nb env update コマンドリファレンス: 保存済みの API、認証、ソースコード、アプリケーション、データベース設定を更新します。'
keywords: 'nb env update,NocoBase CLI,env 設定,認証,データベース,ソースコード'
---

# nb env update

`nb env update` は、保存済み env の設定を更新するために使用します。API アドレス、認証方式、ソースコードの取得元、ローカルアプリのパス、ポート、データベースパラメータなどを調整できます。更新が完了すると、CLI は変更内容に応じて後続処理を自動的に行います。

設定パラメータを指定しない場合でも、CLI は現在の env 状態に基づいて再同期を実行します。

## 使い方

```bash
nb env update [name] [flags]
```

## 共通オプション

| オプション  | 型      | 説明                                                          |
| ----------- | ------- | ------------------------------------------------------------- |
| `[name]`    | string  | 更新する設定済み環境の名前。省略時は現在の env を使用します。 |
| `--verbose` | boolean | 詳細な進行状況を表示します。                                  |

## API と認証オプション

| オプション                        | 型     | 説明                                                                                                                                                  |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | `/api` プレフィックスを含む NocoBase API アドレス。                                                                                                   |
| `--auth-type`                     | string | 認証方式: `basic`、`token`、`oauth`。                                                                                                                 |
| `--access-token`, `--token`, `-t` | string | `token` 認証で使用する API キーまたは access token。保存後、認証方式は `token` に切り替わります。                                                     |
| `--username`                      | string | `basic` 認証用に保存するユーザー名。現在の env で `basic` 認証を使用している場合、または `--auth-type basic` を同時に指定した場合にのみ使用できます。 |

## ソースコードとダウンロードのオプション

| オプション                                     | 型      | 説明                                                                                     |
| ---------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| `--source`                                     | string  | 保存済みのアプリケーションソース: `docker`、`git`、`local`、`npm`。                      |
| `--download-version`, `--version`              | string  | 保存済みのバージョンパラメータ: Docker tag、npm パッケージのバージョン、または Git ref。 |
| `--docker-registry`                            | string  | tag を含まない Docker イメージレジストリ名。                                             |
| `--docker-platform`                            | string  | Docker イメージプラットフォーム: `auto`、`linux/amd64`、`linux/arm64`。                  |
| `--git-url`                                    | string  | Git リポジトリ URL。                                                                     |
| `--npm-registry`                               | string  | npm/Git のダウンロードと依存関係インストールに使用する registry。                        |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | npm/Git インストール時に devDependencies をインストールするかどうか。                    |
| `--build` / `--no-build`                       | boolean | npm/Git からダウンロード後に自動ビルドするかどうか。                                     |
| `--build-dts` / `--no-build-dts`               | boolean | ビルド時に TypeScript 宣言ファイルを生成するかどうか。                                   |

## アプリケーションオプション

| オプション   | 型     | 説明                                                                                                               |
| ------------ | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `--app-path` | string | アプリケーションディレクトリ。現在はローカルディレクトリ管理にこのオプションを優先して使うことが推奨されています。 |
| `--app-port` | string | アプリケーションの HTTP ポート。                                                                                   |
| `--app-key`  | string | アプリケーションキー（`APP_KEY`）。                                                                                |
| `--timezone` | string | アプリケーションのタイムゾーン（`TZ`）。                                                                           |

## データベースオプション

| オプション                                 | 型      | 説明                                                             |
| ------------------------------------------ | ------- | ---------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | CLI が管理する組み込みデータベースを使用するかどうか。           |
| `--db-dialect`                             | string  | データベース種別: `postgres`、`mysql`、`mariadb`、`kingbase`。   |
| `--builtin-db-image`                       | string  | 組み込みデータベースのコンテナイメージ。                         |
| `--db-host`                                | string  | データベースホストアドレス。                                     |
| `--db-port`                                | string  | データベースポート。                                             |
| `--db-database`                            | string  | データベース名。                                                 |
| `--db-user`                                | string  | データベースユーザー名。                                         |
| `--db-password`                            | string  | データベースパスワード。                                         |
| `--db-schema`                              | string  | データベース schema。通常は PostgreSQL のみで使用されます。      |
| `--db-table-prefix`                        | string  | データベーステーブルのプレフィックス。                           |
| `--db-underscored` / `--no-db-underscored` | boolean | テーブル名とフィールド名にアンダースコア形式を使用するかどうか。 |

## 設定クリアオプション

| オプション | 型       | 説明                                                                                                                                               |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--unset`  | string[] | フラグの正規名で 1 つ以上の保存済みフィールドをクリアします。繰り返し指定でき、`--unset git-url,username` のようにカンマ区切りにも対応しています。 |

## 説明

:::tip

CLI に現在の env の最新状態で再同期させたいだけなら、`nb env update` または `nb env update <name>` を実行するだけで十分です。追加のパラメータは不要です。

:::

- 更新完了後、CLI は今回の変更内容に基づいて必要な後続同期を自動的に処理します
- その他のオプションは保存済みの env 設定を更新するだけで、アプリケーションの自動再起動やローカルソースコード・Docker イメージの自動置換は行いません
- `app-path`、`app-port`、`timezone`、`db-*` などの設定を変更した後、CLI は通常 `nb app restart --env <name>` を後で実行するよう案内します。変更が CLI 管理の組み込みデータベースに関わる場合は、`nb app restart --env <name> --with-db` を使うよう案内します
- `source`、`download-version`、`docker-registry`、`git-url`、`npm-registry` などのソース設定を更新しても、変更されるのは保存値のみです。既存のローカルソースコード、依存関係、イメージは自動的には置き換えられません
- `--access-token` は `--auth-type basic` または `--auth-type oauth` と一緒には使用できません
- 同じフィールドに対して `--unset` と明示的な値指定を同時に使用することはできません。たとえば `--unset git-url` と `--git-url ...` を同時に書くことはできません
- 認証方式を `basic` または `oauth` に切り替えた場合、または token をクリアした場合、通常は後続で `nb env auth <name>` を実行する必要があります

## 例

```bash
# 現在の env を最新状態で再同期する
nb env update

# 指定した env を最新状態で再同期する
nb env update prod

# API アドレスを更新する
nb env update prod --api-base-url http://localhost:13000/api

# token を更新し、認証方式を token に切り替える
nb env update prod --access-token <token>

# basic 認証に切り替え、ユーザー名だけを保存して、後で nb env auth を実行する
nb env update prod --auth-type basic --username admin

# ソースの取得元とバージョンを調整し、保存済み設定のみを更新する
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# アプリケーションのポートとタイムゾーンを調整し、後でアプリケーションを再起動する
nb env update local --app-port 13080 --timezone Asia/Shanghai

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
