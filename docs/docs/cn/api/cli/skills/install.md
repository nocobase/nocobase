---
title: "nb skills install"
description: "nb skills install 命令参考：全局安装 NocoBase AI coding skills。"
keywords: "nb skills install,NocoBase CLI,安装 skills"
---

# nb skills install

全局安装 NocoBase AI coding skills。如果已经安装，该命令不会执行更新。

## 用法

```bash
nb skills install [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | 跳过安装确认 |
| `--json` | boolean | 输出 JSON |
| `--verbose` | boolean | 显示详细安装输出 |

## 示例

```bash
nb skills install
nb skills install --yes
nb skills install --json
```

## 相关命令

- [`nb skills check`](./check.md)
- [`nb skills update`](./update.md)
