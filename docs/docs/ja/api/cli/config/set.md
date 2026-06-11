---
title: "nb config set"
description: "nb config set コマンドリファレンス：CLI 設定項目を設定します。"
keywords: "nb config set,NocoBase CLI,設定を保存"
---

# nb config set

CLI 設定項目を設定します。対応している設定キーは [`nb config`](./index.md) を参照してください。

## 使い方

```bash
nb config set <key> <value>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<key>` | string | 設定項目名。対応している値は [`nb config`](./index.md) を参照してください |
| `<value>` | string | 設定値。空にはできません |

## 例

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.caddy /opt/homebrew/bin/caddy
nb config set bin.git /usr/bin/git
nb config set bin.nginx /usr/sbin/nginx
nb config set proxy.nb-cli-root /workspace
nb config set proxy.upstream-host host.docker.internal
nb config set bin.yarn yarn
```

## 補足

`update.policy` では `prompt`、`auto`、`off` が使えます。デフォルト値は `prompt` です。

## 関連コマンド

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
