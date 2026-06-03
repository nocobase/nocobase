---
title: 'nb config set'
description: 'nb config set コマンドリファレンス：CLI の設定項目を設定します。'
keywords: 'nb config set,NocoBase CLI,設定を行う'
---

# nb config set

CLI の設定項目を設定します。現在サポートされている設定項目は `locale`、`update.policy`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git`、`bin.yarn` です。

## 使い方

```bash
nb config set <key> <value>
```

## パラメータ

| パラメータ | 型     | 説明                                                                                                                          |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `<key>`    | string | 設定項目名：`locale`、`update.policy`、`docker.network`、`docker.container-prefix`、`bin.docker`、`bin.git` または `bin.yarn` |
| `<value>`  | string | 設定値。空にすることはできません                                                                                              |

## 例

```bash
nb config set locale zh-CN
nb config set update.policy auto
nb config set docker.network nocobase
nb config set docker.container-prefix nb
nb config set bin.docker /usr/local/bin/docker
nb config set bin.git /usr/bin/git
nb config set bin.yarn yarn
```

## 説明

`update.policy` は `prompt`、`auto`、`off` をサポートし、デフォルト値は `prompt` です。

## 関連コマンド

- [`nb config get`](./get.md)
- [`nb config delete`](./delete.md)
