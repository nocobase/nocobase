---
title: "nb app autostart enable"
description: "nb app autostart enable 命令参考：为指定 local 或 Docker env 开启应用自启动标记。"
keywords: "nb app autostart enable,NocoBase CLI,自启动,env"
---

# nb app autostart enable

为指定 env 开启应用自启动标记。

这个标记只适用于当前机器上由 CLI 托管运行态的 `local` 或 `docker` env。它本身不会立刻启动应用，而是把这个 env 加入后续 `nb app autostart run` 的启动名单。

## 用法

```bash
nb app autostart enable [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要加入自启动的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

## 示例

```bash
nb app autostart enable
nb app autostart enable --env app1
nb app autostart enable --env app1 --yes
```

## 说明

只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致。如果显式指定了不同的 env，交互终端会先确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

如果目标 env 不是当前机器上由 CLI 托管运行态的 `local` 或 `docker` env，命令会直接报错，不会保存自启动标记。

## 相关命令

- [`nb app autostart disable`](./disable.md)
- [`nb app autostart list`](./list.md)
- [`nb app autostart run`](./run.md)
