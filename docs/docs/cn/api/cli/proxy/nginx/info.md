---
title: "nb proxy nginx info"
description: "nb proxy nginx info 命令参考：查看当前 Nginx provider 的 driver、配置路径和运行信息。"
keywords: "nb proxy nginx info,NocoBase CLI,nginx,路径,配置"
---

# nb proxy nginx info

查看当前 Nginx provider 的 driver、配置路径和运行信息。

## 用法

```bash
nb proxy nginx info
```

## 输出

通常会输出这些字段：

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBin` 或 `container`
- `image`

其中：

- `local` driver 下会显示 `nginxBin`
- `docker` driver 下会显示 `container` 和 `image`

## 示例

```bash
nb proxy nginx info
```

## 相关命令

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
