---
title: "nb app autostart run"
description: "nb app autostart run 命令参考：启动所有已经开启应用自启动标记的 env。"
keywords: "nb app autostart run,NocoBase CLI,自启动,批量启动"
---

# nb app autostart run

启动所有已经开启应用自启动标记的 env。

这条命令通常用在系统启动之后，由宿主机自启动机制统一调用。CLI 会读取所有已保存 env，筛出已经开启自启动标记的项目，然后逐个尝试启动。

## 用法

```bash
nb app autostart run [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--verbose` | boolean | 显示底层本地或 Docker 启动命令输出 |

## 示例

```bash
nb app autostart run
nb app autostart run --verbose
```

## 说明

如果当前没有任何 env 开启了自启动，命令会直接输出 `No environments have app autostart enabled.`。

执行过程中，CLI 会逐个处理已经启用自启动的 env：

- 能正常启动的，会在结果表里显示 `started`
- 不适合在当前机器上自动启动的，会显示 `skipped`
- 启动过程中报错的，会显示 `failed`

内部实际调用的是 `nb app start --env <name> --yes`；如果你传入了 `--verbose`，也会把这个参数继续传给底层启动流程。

只要结果里存在 `failed`，命令最后会以错误退出，并输出 `Some app autostart envs failed to start.`。这通常是为了让你在 `systemd`、CI 或其他主机启动机制里能明确感知到失败。

## 相关命令

- [`nb app autostart enable`](./enable.md)
- [`nb app start`](../start.md)
- [`nb app logs`](../logs.md)
