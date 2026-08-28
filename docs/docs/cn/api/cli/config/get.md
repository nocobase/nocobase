---
title: 'nb config get'
description: 'nb config get 命令参考：读取某个 CLI 配置项的生效值。'
keywords: 'nb config get,NocoBase CLI,读取配置'
---

# nb config get

读取指定 CLI 配置项的生效值。若未显式设置，则返回默认值。

## 用法

```bash
nb config get <key>
```

## 参数

| 参数    | 类型   | 说明                                             |
| ------- | ------ | ------------------------------------------------ |
| `<key>` | string | 配置项名称；支持的值见 [`nb config`](./index.md) |

## 示例

```bash
nb config get locale
nb config get update.policy
nb config get license.pkg-url
nb config get docker.network
nb config get docker.container-prefix
nb config get nb-image-registry
nb config get nb-image-variant
nb config get proxy.nb-cli-root
nb config get proxy.upstream-host
nb config get bin.nginx
nb config get bin.git
```

## 相关命令

- [`nb config set`](./set.md)
- [`nb config list`](./list.md)
