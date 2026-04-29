---
title: "nb self"
description: "nb self 命令参考：检查或更新已安装的 NocoBase CLI。"
keywords: "nb self,NocoBase CLI,自更新,版本检查"
---

# nb self

检查或更新已安装的 NocoBase CLI。

## 用法

```bash
nb self <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb self check`](./check.md) | 检查当前 CLI 版本和自更新支持情况 |
| [`nb self update`](./update.md) | 更新全局 npm 安装的 NocoBase CLI |

## 示例

```bash
nb self check
nb self check --json
nb self update --yes
```

## 相关命令

- [`nb skills`](../skills/)
- [`nb app upgrade`](../app/upgrade.md)
