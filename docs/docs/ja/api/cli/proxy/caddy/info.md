---
title: "nb proxy caddy info"
description: "nb proxy caddy info コマンドリファレンス: 現在の Caddy provider driver、設定パス、runtime 詳細を表示します。"
keywords: "nb proxy caddy info,NocoBase CLI,caddy,paths,configuration"
---

# nb proxy caddy info

現在の Caddy provider driver、設定パス、および runtime 詳細を表示します。

## 使い方

```bash
nb proxy caddy info
```

## 出力

通常、出力には次のフィールドが含まれます。

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` または `container`
- `image`

内訳は次のとおりです。

- `local` driver では `caddyBinary` が表示されます
- `docker` driver では `container` と `image` が表示されます

## 例

```bash
nb proxy caddy info
```

## 関連コマンド

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
