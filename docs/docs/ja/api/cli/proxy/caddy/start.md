---
title: "nb proxy caddy start"
description: "現在の driver で Caddy proxy を起動します。"
keywords: "nb proxy caddy start,NocoBase CLI,caddy,start"
---

# nb proxy caddy start

現在の driver で Caddy proxy を起動します。

## 使い方

```bash
nb proxy caddy start
```

## 例

```bash
nb proxy caddy start
```

## 注意

- `local` driver ではローカルの Caddy プロセスを起動します
- `docker` driver では Docker コンテナを起動するか、必要なら作成します
- すでに起動中の場合は、その旨が表示されます

## 関連コマンド

- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy status`](./status.md)
