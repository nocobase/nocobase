---
title: "nb app down"
description: "nb app down 命令参考：停止并清理指定 env 的本地运行资源。"
keywords: "nb app down,NocoBase CLI,清理资源,删除容器,storage"
---

# nb app down

停止并清理指定 env 的本地运行资源。默认会保留 storage 数据和 env 配置；删除全部内容时必须显式传入 `--all --yes`。

## 用法

```bash
nb app down [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要清理的 CLI env 名称，省略时使用当前 env |
| `--all` | boolean | 删除该 env 的所有内容，包括 storage 数据和保存的 env 配置 |
| `--yes`, `-y` | boolean | 跳过破坏性操作确认，通常和 `--all` 一起使用 |
| `--verbose` | boolean | 显示底层停止和清理命令输出 |

## 示例

```bash
nb app down --env app1
nb app down --env app1 --all --yes
```

## 相关命令

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
