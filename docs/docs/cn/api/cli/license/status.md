---
title: "nb license status"
description: "nb license status 命令参考：查看指定 env 的商业授权状态。"
keywords: "nb license status,NocoBase CLI,授权状态"
---

# nb license status

查看指定 env 的商业授权状态。

## 用法

```bash
nb license status [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--doctor` | boolean | 执行额外诊断检查并输出建议 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## 说明

当前新 CLI 中，授权状态检查后端仍未完全实现。命令可以返回基础上下文和诊断占位信息，但不会给出完整授权判定。

如果显式传入 `--env`，并且它与当前 env 不一致，CLI 会先要求确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
