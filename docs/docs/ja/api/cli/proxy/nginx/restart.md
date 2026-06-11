---
title: "nb proxy nginx restart"
description: "現在の driver で Nginx proxy を再起動します。"
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

現在の driver で Nginx proxy を再起動します。

## 使い方

```bash
nb proxy nginx restart
```

## 例

```bash
nb proxy nginx restart
```

## 注意

- このコマンドは、いったん proxy を停止してから再度起動します
- `local` または `docker` の場合、現在の driver に対応するローカルプロセスまたは Docker コンテナに対して動作します

## 関連コマンド

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
