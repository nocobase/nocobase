---
title: "nb skills update"
description: "nb skills update 命令参考：更新全局 NocoBase AI coding skills。"
keywords: "nb skills update,NocoBase CLI,更新 skills"
---

# nb skills update

更新全局安装的 NocoBase AI coding skills。该命令只更新已有的 `@nocobase/skills` 安装。

## 用法

```bash
nb skills update [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | 跳过更新确认 |
| `--json` | boolean | 输出 JSON |
| `--verbose` | boolean | 显示详细更新输出 |

## 示例

```bash
nb skills update
nb skills update --yes
nb skills update --json
```

## 相关命令

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
