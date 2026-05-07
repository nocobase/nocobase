---
title: "nb init"
description: "nb init コマンドリファレンス：NocoBase を初期化し、既存アプリケーションへの接続または新規アプリケーションのインストールを行い、CLI env として保存します。"
keywords: "nb init,NocoBase CLI,初期化,env,Docker,npm,Git"
---

# nb init

現在のワークスペースを初期化し、coding agent が NocoBase に接続して使用できるようにします。`nb init` は既存のアプリケーションに接続することも、Docker、npm、または Git で新しいアプリケーションをインストールすることもできます。

## 使い方

```bash
nb init [flags]
```

## 説明

`nb init` は 3 つのプロンプトモードをサポートしています：

- デフォルトモード：ターミナルでステップごとに入力します。
- `--ui`：ローカルブラウザフォームでガイドフローを完了します。
- `--yes`：プロンプトをスキップしてデフォルト値を使用します。このモードでは `--env <envName>` を指定する必要があり、新しいローカルアプリケーションが作成されます。

デフォルトでは、`nb init` は初期化時または初期化の再開時に NocoBase AI coding skills をインストールまたは更新します。すでに skills を自己管理している場合や、CI・オフライン環境で実行する場合は、`--skip-skills` でこのステップをスキップできます。

env 設定の保存後に初期化が中断された場合は、`--resume` で続行できます：

```bash
nb init --env app1 --resume
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | プロンプトをスキップし、flags とデフォルト値を使用します |
| `--env`, `-e` | string | 今回の初期化の env 名。`--yes` および `--resume` モードでは必須です |
| `--ui` | boolean | ブラウザのビジュアルウィザードを開きます。`--yes` とは併用できません |
| `--verbose` | boolean | 詳細なコマンド出力を表示します |
| `--skip-skills` | boolean | 初期化時の NocoBase AI coding skills のインストールまたは更新をスキップします |
| `--ui-host` | string | `--ui` ローカルサーバーのバインドアドレス。デフォルトは `127.0.0.1` です |
| `--ui-port` | integer | `--ui` ローカルサーバーのポート。`0` で自動割り当てです |
| `--locale` | string | CLI プロンプトと UI の言語：`en-US` または `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase API アドレス。`/api` プレフィックスを含みます |
| `--auth-type`, `-a` | string | 認証方式：`token` または `oauth` |
| `--access-token`, `-t` | string | `token` 認証方式で使用する API key または access token |
| `--resume` | boolean | 保存済みの workspace env config を再利用して初期化を続行します |
| `--lang`, `-l` | string | インストール後の NocoBase アプリケーションの言語 |
| `--force`, `-f` | boolean | 既存の env を再設定し、必要に応じて競合する実行リソースを置き換えます |
| `--app-root-path` | string | ローカル npm/Git アプリケーションのソースディレクトリ。デフォルトは `./<envName>/source/` です |
| `--app-port` | string | ローカルアプリケーションのポート。デフォルトは `13000`。`--yes` モードでは空きポートが自動選択されます |
| `--storage-path` | string | アップロードファイルとホストデータベースのデータディレクトリ。デフォルトは `./<envName>/storage/` です |
| `--root-username` | string | 初期管理者ユーザー名 |
| `--root-email` | string | 初期管理者メールアドレス |
| `--root-password` | string | 初期管理者パスワード |
| `--root-nickname` | string | 初期管理者ニックネーム |
| `--builtin-db`, `--no-builtin-db` | boolean | CLI 管理の組み込みデータベースを作成するかどうか |
| `--db-dialect` | string | データベースの種類：`postgres`、`mysql`、`mariadb`、`kingbase` |
| `--builtin-db-image` | string | 組み込みデータベースのコンテナイメージ |
| `--db-host` | string | データベースホスト |
| `--db-port` | string | データベースポート |
| `--db-database` | string | データベース名 |
| `--db-user` | string | データベースユーザー |
| `--db-password` | string | データベースパスワード |
| `--fetch-source` | boolean | インストール前にアプリケーションファイルのダウンロードまたは Docker イメージの pull を行います |
| `--source`, `-s` | string | NocoBase の取得方法：`docker`、`npm`、または `git` |
| `--version`, `-v` | string | バージョンパラメータ：npm バージョン、Docker イメージ tag、または Git ref |
| `--replace`, `-r` | boolean | ターゲットディレクトリが既に存在する場合に置き換えます |
| `--dev-dependencies`, `-D` | boolean | npm/Git インストール時に devDependencies もインストールするかどうか |
| `--output-dir`, `-o` | string | ダウンロード先ディレクトリ、または Docker tarball の保存ディレクトリ |
| `--git-url` | string | Git リポジトリの URL |
| `--docker-registry` | string | Docker イメージリポジトリ名（tag を含まない） |
| `--docker-platform` | string | Docker イメージプラットフォーム：`auto`、`linux/amd64`、`linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Docker イメージを pull した後に tarball として保存するかどうか |
| `--npm-registry` | string | npm/Git のダウンロードおよび依存関係のインストールに使用する registry |
| `--build`, `--no-build` | boolean | npm/Git の依存関係インストール後にビルドを行うかどうか |
| `--build-dts` | boolean | npm/Git ビルド時に TypeScript 宣言ファイルを生成するかどうか |

## 使用例

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --yes --skip-skills
nb init --env app1 --resume
nb init --env app1 --resume --skip-skills
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## 関連コマンド

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
