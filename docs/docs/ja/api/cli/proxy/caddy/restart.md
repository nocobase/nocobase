---
title: "nb proxy caddy restart"
description: "現在の driver で Caddy proxy を再起動します。"
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

現在の driver で Caddy proxy を再起動します。

## 使い方

```bash
nb proxy caddy restart
```

## 例

```bash
nb proxy caddy restart
```

## 注意

- このコマンドは、いったん proxy を停止してから再度起動します
- `local` または `docker` の場合、現在の driver に対応するローカルプロセスまたは Docker コンテナに対して動作します

## 関連コマンド

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
