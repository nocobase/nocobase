---
title: "nb license id"
description: "nb license id 命令参考：查看或重新生成指定 env 的商业授权实例 ID。"
keywords: "nb license id,NocoBase CLI,实例ID"
---

# nb license id

查看指定 env 的商业授权实例 ID。如实例 ID 尚未保存，CLI 会自动生成并保存。

## 用法

```bash
nb license id [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--force` | boolean | 即使已存在已保存实例 ID，也强制重新生成 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license id
nb license id --env app1
nb license id --env app1 --force
nb license id --env app1 --json
```

## 相关命令

- [`nb license activate`](./activate.md)
