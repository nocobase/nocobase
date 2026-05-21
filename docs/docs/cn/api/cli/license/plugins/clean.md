---
title: "nb license plugins clean"
description: "nb license plugins clean 命令参考：清理指定 env 已下载的商业插件。"
keywords: "nb license plugins clean,NocoBase CLI,清理商业插件"
---

# nb license plugins clean

清理指定 env 已下载的商业插件，但不会改变 license 激活状态。

## 用法

```bash
nb license plugins clean [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--dry-run` | boolean | 仅预览将要删除的插件，不执行删除 |
| `--verbose` | boolean | 输出每个插件的详细清理日志 |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

## 说明

如果显式传入 `--env`，并且它与当前 env 不一致，CLI 会先要求确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
