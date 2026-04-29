---
title: "nb skills"
description: "nb skills 命令参考：检查、安装、更新或移除全局 NocoBase AI coding skills。"
keywords: "nb skills,NocoBase CLI,skills,AI coding skills"
---

# nb skills

检查、安装、更新或移除全局 NocoBase AI coding skills。

## 用法

```bash
nb skills <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb skills check`](./check.md) | 检查全局 NocoBase AI coding skills |
| [`nb skills install`](./install.md) | 全局安装 NocoBase AI coding skills |
| [`nb skills update`](./update.md) | 更新已安装的 NocoBase AI coding skills |
| [`nb skills remove`](./remove.md) | 移除由 `nb` 管理的 NocoBase AI coding skills |

## 示例

```bash
nb skills check
nb skills install --yes
nb skills update --json
nb skills remove --yes
```

## 相关命令

- [`nb init`](../init.md)
- [`nb self`](../self/)
