---
title: "nb config set"
description: "nb config set コマンドリファレンス：CLI 設定キーに値を設定します。"
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

CLI 設定値を設定します。サポートされているキーは `locale`、`update.policy`、`license.pkg-url`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git`、`bin.yarn` です。

## 使い方

```bash
nb config set <key> <value>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<key>` | string | 設定キー：`locale`、`update.policy`、`license.pkg-url`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git`、`bin.yarn` |
| `<value>` | string | 設定値。空にできません |

## 使用例

```bash
nb config set locale ja-JP
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## 補足

`license.pkg-url` を設定する際、CLI は URL が `/` で終わるように正規化します。

`update.policy` には `prompt`、`auto`、`off` を指定できます。デフォルト値は `prompt` です。

## 関連コマンド

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
