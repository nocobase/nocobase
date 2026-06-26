---
title: "nb config delete"
description: "nb config delete 命令参考：删除某个显式设置的 CLI 配置项。"
keywords: "nb config delete,NocoBase CLI,删除配置"
---

# nb config delete

删除某个显式设置过的 CLI 配置项。删除后，该配置项会回退到默认值。

## 用法

```bash
nb config delete <key>
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<key>` | string | 配置项名称；支持的值见 [`nb config`](./index.md) |

## 示例

```bash
nb config delete locale
nb config delete update.policy
nb config delete docker.network
nb config delete docker.container-prefix
nb config delete proxy.nb-cli-root
nb config delete proxy.upstream-host
nb config delete bin.nginx
nb config delete bin.git
nb config delete bin.pnpm
```

## 相关命令

- [`nb config set`](./set.md)
- [`nb config get`](./get.md)
