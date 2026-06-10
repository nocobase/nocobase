---
title: "nb proxy caddy use"
description: "nb proxy caddy use 命令参考：切换 Caddy provider 当前使用的 driver。"
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

切换 Caddy provider 当前使用的 driver。

## 用法

```bash
nb proxy caddy use <driver>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<driver>` | string | 支持 `local` 或 `docker` |

## 示例

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## 说明

- 命令会把结果保存到 `proxy.caddy-driver`
- 后续 `start`、`reload`、`stop`、`status`、`info` 都会基于当前 driver 工作

## 相关命令

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
