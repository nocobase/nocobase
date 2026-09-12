---
title: "nb proxy caddy stop"
description: "現在の driver で Caddy proxy を停止します。"
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

現在の driver で Caddy proxy を停止します。

## 使い方

```bash
nb proxy caddy stop
```

## 例

```bash
nb proxy caddy stop
```

## 注意

- `local` driver ではローカルの Caddy プロセスを停止します
- `docker` driver では proxy コンテナを停止します
- すでに停止している場合は、その旨が表示されます

## 関連コマンド

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
