---
title: "nb proxy caddy use"
description: "Caddy provider が現在使う driver を切り替えます。"
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Caddy provider が現在使う driver を切り替えます。

## 使い方

```bash
nb proxy caddy use <driver>
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<driver>` | string | `local` または `docker` を指定できます |

## 例

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## 注意

- 実行結果は `proxy.caddy-driver` に保存されます
- `start`、`reload`、`stop`、`status`、`info` などの後続コマンドは、すべて現在の driver を使って動作します

## 関連コマンド

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
