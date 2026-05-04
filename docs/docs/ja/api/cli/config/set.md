---
title: "nb config set"
description: "nb config set コマンドリファレンス：CLI 設定値を設定します。"
keywords: "nb config set,NocoBase CLI,configuration"
---

# nb config set

CLI 設定値を設定します。サポートされているキーは `license.pkg-url`、`docker.network`、`docker.container-prefix` です。

## 使い方

```bash
nb config set <key> <value>
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<key>` | string | 設定キー：`license.pkg-url`、`docker.network`、`docker.container-prefix` |
| `<value>` | string | 設定値。空にできません |

## 使用例

```bash
nb config set license.pkg-url https://pkg.nocobase.com/
nb config set docker.network nocobase
nb config set docker.container-prefix nb
```

## 補足

`license.pkg-url` を設定する際、CLI は URL が `/` で終わるように正規化します。

## 関連コマンド

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
