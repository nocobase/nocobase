---
title: "nb env remove"
description: "nb env remove 命令参考：移除指定 NocoBase CLI env 配置。"
keywords: "nb env remove,NocoBase CLI,删除环境,移除配置"
---

# nb env remove

移除一个已配置的 env。该命令只删除已保存的 CLI env 配置，不会清理本地应用目录、容器或 storage 数据；需要清理本地运行时资源时，请使用 [`nb app down`](../app/down.md)。

如果被移除的是当前 env，CLI 会在剩余 env 里自动选择一个新的 current env；如果已经没有可用 env，则 current env 会被清空。

默认情况下，命令会要求确认；如需跳过确认，可显式传入 `--yes`。在非交互模式下，必须传入 `--yes` 才能执行删除。

## 用法

```bash
nb env remove <name> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<name>` | string | 要移除的已配置环境名称 |
| `--yes`, `-y` | boolean | 跳过确认并删除已保存的 CLI env 配置 |
| `--verbose` | boolean | 显示详细进度 |

## 示例

```bash
nb env remove staging
nb env remove staging --yes
```

## 相关命令

- [`nb app down`](../app/down.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
