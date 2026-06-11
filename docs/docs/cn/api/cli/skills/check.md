---
title: "nb skills check"
description: "nb skills check 命令参考：检查全局 NocoBase AI coding skills。"
keywords: "nb skills check,NocoBase CLI,skills 检查"
---

# nb skills check

检查全局 NocoBase AI coding skills，报告是否由 CLI 管理以及是否有可用更新。

## 用法

```bash
nb skills check [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb skills check
nb skills check --json
```

## 相关命令

- [`nb skills install`](./install.md)
- [`nb skills update`](./update.md)
