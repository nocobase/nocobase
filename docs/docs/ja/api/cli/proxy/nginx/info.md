---
title: "nb proxy nginx info"
description: "nb proxy nginx info コマンドリファレンス: 現在の Nginx provider driver、設定パス、runtime 詳細を表示します。"
keywords: "nb proxy nginx info,NocoBase CLI,nginx,paths,configuration"
---

# nb proxy nginx info

現在の Nginx provider driver、設定パス、および runtime 詳細を表示します。

## 使い方

```bash
nb proxy nginx info
```

## 出力

通常、出力には次のフィールドが含まれます。

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` または `container`
- `image`

内訳は次のとおりです。

- `local` driver では `nginxBinary` が表示されます
- `docker` driver では `container` と `image` が表示されます

## 例

```bash
nb proxy nginx info
```

## 関連コマンド

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
