---
title: "nb proxy caddy info"
description: "nb proxy caddy info 命令参考：查看当前 Caddy provider 的 driver、配置路径和运行信息。"
keywords: "nb proxy caddy info,NocoBase CLI,caddy,路径,配置"
---

# nb proxy caddy info

查看当前 Caddy provider 的 driver、配置路径和运行信息。

## 用法

```bash
nb proxy caddy info
```

## 输出

通常会输出这些字段：

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBin` 或 `container`
- `image`

其中：

- `local` driver 下会显示 `caddyBin`
- `docker` driver 下会显示 `container` 和 `image`

## 示例

```bash
nb proxy caddy info
```

## 相关命令

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
