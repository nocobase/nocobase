---
title: "nb app down"
description: "nb app down 命令参考：停止并清理指定 env 的本地运行资源。"
keywords: "nb app down,NocoBase CLI,清理资源,删除容器,storage"
---

# nb app down

停止并清理指定 env 的本地运行资源。默认会保留 storage 数据和 env 配置；删除全部内容时必须显式传入 `--all --force`。

## 用法

```bash
nb app down [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要清理的 CLI env 名称，省略时使用当前 env |
| `--all` | boolean | 删除该 env 的所有内容，包括 storage 数据和保存的 env 配置 |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--force`, `-f` | boolean | 强制执行破坏性清理，例如 `--all` 或非交互场景下的高风险清理 |
| `--verbose` | boolean | 显示底层停止和清理命令输出 |

## 示例

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --yes
```

## 说明

`--yes` 和 `--force` 的职责不同：

- `--yes` 只用于跳过显式 `--env` 跨当前 env 时的交互确认。
- `--force` 用于真正的强制执行语义，例如 `--all` 清理，或者非交互场景下继续执行高风险清理。

## 相关命令

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
