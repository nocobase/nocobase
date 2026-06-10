---
title: "nb proxy nginx use"
description: "Nginx provider が現在使う driver を切り替えます。"
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Nginx provider が現在使う driver を切り替えます。

## 使い方

```bash
nb proxy nginx use <driver>
```

## パラメーター

| パラメーター | 型 | 説明 |
| --- | --- | --- |
| `<driver>` | string | `local` または `docker` を指定できます |

## 例

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## 注意

- 実行結果は `proxy.nginx-driver` に保存されます
- `start`、`reload`、`stop`、`status`、`info` などの後続コマンドは、すべて現在の driver を使って動作します

## 関連コマンド

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
