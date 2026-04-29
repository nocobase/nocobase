---
title: "nb self update"
description: "nb self update 命令参考：更新全局 npm 安装的 NocoBase CLI。"
keywords: "nb self update,NocoBase CLI,更新,自更新"
---

# nb self update

当当前 CLI 由标准全局 npm 安装管理时，更新已安装的 NocoBase CLI。

## 用法

```bash
nb self update [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--channel` | string | 更新到的发布 channel，默认 `auto`；可选 `auto`、`latest`、`beta`、`alpha` |
| `--yes`, `-y` | boolean | 跳过更新确认 |
| `--json` | boolean | 输出 JSON |
| `--verbose` | boolean | 显示详细更新输出 |

## 示例

```bash
nb self update
nb self update --yes
nb self update --channel alpha --json
```

## 相关命令

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
