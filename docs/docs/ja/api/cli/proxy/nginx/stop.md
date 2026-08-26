---
title: "nb proxy nginx stop"
description: "現在の driver で Nginx proxy を停止します。"
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

現在の driver で Nginx proxy を停止します。

## 使い方

```bash
nb proxy nginx stop
```

## 例

```bash
nb proxy nginx stop
```

## 注意

- `local` driver ではローカルの Nginx プロセスを停止します
- `docker` driver では proxy コンテナを停止します
- すでに停止している場合は、その旨が表示されます

## 関連コマンド

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
