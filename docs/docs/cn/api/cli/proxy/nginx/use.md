---
title: "nb proxy nginx use"
description: "nb proxy nginx use 命令参考：切换 Nginx provider 当前使用的 driver。"
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

切换 Nginx provider 当前使用的 driver。

## 用法

```bash
nb proxy nginx use <driver>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<driver>` | string | 支持 `local` 或 `docker` |

## 示例

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## 说明

- 命令会把结果保存到 `proxy.nginx-driver`
- 后续 `start`、`reload`、`stop`、`status`、`info` 都会基于当前 driver 工作

## 相关命令

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
