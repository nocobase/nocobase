---
title: 'nb config get'
description: 'nb config get コマンドリファレンス：CLI 設定項目の実際に有効な値を読み取ります。'
keywords: 'nb config get,NocoBase CLI,設定を読む'
---

# nb config get

指定した CLI 設定項目の実際に有効な値を読み取ります。明示的に設定されていない場合は、デフォルト値が返されます。

## 使い方

```bash
nb config get <key>
```

## パラメータ

| パラメータ | 型     | 説明                                                                      |
| ---------- | ------ | ------------------------------------------------------------------------- |
| `<key>`    | string | 設定項目名。対応している値は [`nb config`](./index.md) を参照してください |

## 例

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get nb-image-registry
nb config get nb-image-variant
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## 関連コマンド

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
