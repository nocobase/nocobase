---
title: "nb skills remove"
description: "nb skills remove 命令参考：移除全局 NocoBase AI coding skills。"
keywords: "nb skills remove,NocoBase CLI,移除 skills"
---

# nb skills remove

移除由 `nb` 管理的全局 NocoBase AI coding skills。

## 用法

```bash
nb skills remove [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--yes`, `-y` | boolean | 跳过移除确认 |
| `--json` | boolean | 输出 JSON |
| `--verbose` | boolean | 显示详细移除输出 |

## 示例

```bash
nb skills remove
nb skills remove --yes
nb skills remove --json
```

## 相关命令

- [`nb skills check`](./check.md)
- [`nb skills install`](./install.md)
