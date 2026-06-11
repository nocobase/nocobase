---
title: "nb proxy nginx reload"
description: "現在の driver で Nginx 設定を再読み込みします。"
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

現在の driver で Nginx 設定を再読み込みします。

## 使い方

```bash
nb proxy nginx reload
```

## 例

```bash
nb proxy nginx reload
```

## 注意

- このコマンドは通常、設定を再生成した後に使います
- `reload` を使うには Nginx がすでに起動している必要があります。まだ起動していない場合は、先に `nb proxy nginx start` を実行してください
- `local` driver ではローカルの Nginx を再読み込みし、`docker` driver ではコンテナ内の Nginx を再読み込みします

## 関連コマンド

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
