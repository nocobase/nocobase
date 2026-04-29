---
title: "nb env remove"
description: "nb env remove 命令参考：移除指定 NocoBase CLI env 配置。"
keywords: "nb env remove,NocoBase CLI,删除环境,移除配置"
---

# nb env remove

移除一个已配置的 env。该命令只删除 CLI env 配置；需要清理本地应用、容器和 storage 时，请使用 [`nb app down`](../app/down.md)。

## 用法

```bash
nb env remove <name> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<name>` | string | 要移除的环境名称 |
| `--force`, `-f` | boolean | 跳过确认直接删除 |
| `--verbose` | boolean | 显示详细进度 |

## 示例

```bash
nb env remove staging
nb env remove staging -f
```

## 相关命令

- [`nb app down`](../app/down.md)
- [`nb env list`](./list.md)
