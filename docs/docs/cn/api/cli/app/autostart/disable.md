---
title: "nb app autostart disable"
description: "nb app autostart disable 命令参考：为指定 env 关闭应用自启动标记。"
keywords: "nb app autostart disable,NocoBase CLI,自启动,env"
---

# nb app autostart disable

为指定 env 关闭应用自启动标记。

关闭后，这个 env 不会再被 `nb app autostart run` 批量启动。不过，它已有的运行状态不会被这个命令直接停止；如果你还想把当前运行中的应用停掉，需要另外执行 `nb app stop`。

## 用法

```bash
nb app autostart disable [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 要移出自启动的 CLI env 名称，省略时使用当前 env |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |

## 示例

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## 说明

这条命令只会修改保存的自启动标记，不会直接停止应用。如果某个 env 原本就没有开启自启动，执行后仍然会把它保持在“未启用”的状态。

跟 `enable` 一样，只有在你显式传入 `--env` 时，CLI 才会检查它是否与当前 env 一致；在非交互终端或 AI agent 场景下，如果你显式指定了不同的 env，需要自己追加 `--yes`。

## 相关命令

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
