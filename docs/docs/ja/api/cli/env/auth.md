---
title: "nb env auth"
description: "nb env auth コマンドリファレンス：保存済みの NocoBase env を basic、token、OAuth で認証します。"
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,ログイン,認証"
---

# nb env auth

保存済みの NocoBase env を再認証するか、その env に保存されている認証情報を更新します。環境名を省略すると、現在の env を使用します。

`nb env auth` は `basic`、`token`、`oauth` の 3 つの認証方式をサポートします。`--auth-type` を省略した場合、CLI はまず渡された認証オプションから方式を推測します。それでも判断できない場合は、env に保存されている認証方式を使用します。

## 使い方

```bash
nb env auth [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | サインイン先の設定済み環境名。省略時は現在の env を使用します |
| `--auth-type`, `-a` | string | 認証方式：`basic`、`token`、`oauth` |
| `--access-token`, `-t` | string | `token` 認証で使用する API key または access token |
| `--username` | string | `basic` 認証で使用するユーザー名。省略時は TTY で入力を求めます |
| `--password` | string | `basic` 認証で使用するパスワード。省略時は TTY で入力を求めます |

## 互換オプション

| オプション | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 環境名です。`[name]` と同じ意味です。この隠しオプションは他のコマンドとの互換性のために残されています。通常は位置引数で十分です |

## 説明

各認証方式の動作は次のとおりです。

- `basic`: ユーザー名とパスワードで NocoBase にサインインし、返された access token とユーザー名を保存します
- `token`: `--access-token` で渡された API key または access token を保存します
- `oauth`: ブラウザ認証フローを開始し、認証完了後に access token を保存します

対話型ターミナルでは、必要に応じて CLI が `--auth-type`、`--username`、`--password`、`--access-token` の入力を求めます。非対話モードで `basic` 認証を使う場合は、`--username` と `--password` の両方が必要です。

`oauth` 認証では、まず Device Authorization Grant を試します。OAuth サーバーがこのフローに対応している場合、コマンドは検証 URL とユーザーコードを表示し、ブラウザ側の承認が完了するまでポーリングします。ローカルの callback listener が不要なので、リモートサーバーやヘッドレス環境でも利用できます。

OAuth サーバーが device authorization endpoint を公開していない場合、コマンドは PKCE loopback フローにフォールバックします。ローカルの callback サービスを起動し、ブラウザで認可を行い、token を交換して設定ファイルに保存します。

認証が成功すると、CLI は自動的に `nb env update <name>` を実行し、env の状態を再同期します。

## 制限

- `[name]` と `--env` に異なる環境名を同時に指定することはできません
- `--access-token` は `--username` または `--password` と同時に使用できません
- `--auth-type oauth` は `--access-token`、`--username`、`--password` と同時に使用できません
- `--auth-type token` は `--username` または `--password` と同時に使用できません
- `--auth-type basic` は `--access-token` と同時に使用できません
- `--access-token`、`--username`、`--password` は、指定した場合に空にはできません

## 使用例

```bash
# 保存済みの認証方式で現在の env を認証
nb env auth

# 指定した env を認証
nb env auth prod

# OAuth ブラウザログインを使用
nb env auth prod --auth-type oauth

# ユーザー名とパスワードでサインイン
nb env auth prod --auth-type basic --username admin --password secret

# API key または access token を保存
nb env auth prod --auth-type token --access-token <api-key>
```

device authorization を使用する場合は、コマンドが表示した URL を開き、表示された code をブラウザに入力します。

## 関連コマンド

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
