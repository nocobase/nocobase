---
title: "nb proxy nginx start"
description: "現在の driver で Nginx proxy を起動します。"
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

現在の driver で Nginx proxy を起動します。

## 使い方

```bash
nb proxy nginx start
```

## 例

```bash
nb proxy nginx start
```

## 注意

- `local` driver ではローカルの Nginx プロセスを起動します
- `docker` driver では Docker コンテナを起動するか、必要なら作成します
- すでに起動中の場合は、その旨が表示されます

## 関連コマンド

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
