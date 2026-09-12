---
title: "nb license"
description: "nb license 命令参考：管理 NocoBase 商业授权和授权插件。"
keywords: "nb license,NocoBase CLI,商业授权,License"
---

# nb license

管理 NocoBase 商业授权，包括用已有 license key 激活授权、查看实例 ID、查看授权状态，以及同步授权插件。

## 用法

```bash
nb license <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb license activate`](./activate.md) | 用已有 license key 为当前 env 激活商业授权 |
| [`nb license id`](./id.md) | 查看或生成当前 env 的实例 ID |
| [`nb license status`](./status.md) | 查看当前 env 的商业授权状态 |
| [`nb license plugins`](./plugins/index.md) | 管理当前授权允许使用的商业插件 |

## 示例

```bash
nb license id --env app1
nb license activate --env app1 --key-file ./license.txt
nb license status --env app1
nb license plugins list --env app1
nb license plugins sync --env app1
```

## 相关命令

- [`nb config`](../config/index.md)
- [`nb plugin`](../plugin/index.md)
- [`nb db check`](../db/check.md)
