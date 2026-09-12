---
title: "nb proxy caddy reload"
description: "現在の driver で Caddy 設定を再読み込みします。"
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

現在の driver で Caddy 設定を再読み込みします。

## 使い方

```bash
nb proxy caddy reload
```

## 例

```bash
nb proxy caddy reload
```

## 注意

- このコマンドは通常、設定を再生成した後に使います
- `reload` を使うには Caddy がすでに起動している必要があります。まだ起動していない場合は、先に `nb proxy caddy start` を実行してください
- `local` driver ではローカルの Caddy を再読み込みし、`docker` driver ではコンテナ内の Caddy を再読み込みします

## 関連コマンド

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
