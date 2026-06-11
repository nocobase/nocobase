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
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--force` | boolean | 即使已存在已保存实例 ID，也强制重新生成 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

## 说明

`--force` 只用于强制重新生成实例 ID，不会替代跨 env 的确认；如果显式 `--env` 指向的不是当前 env，仍然需要交互确认或显式传入 `--yes`。

## 相关命令

- [`nb license activate`](./activate.md)
