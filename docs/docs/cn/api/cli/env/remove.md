---
title: "nb env remove"
description: "nb env remove 命令参考：停止托管运行态后移除 env 配置，或在需要时彻底清理本机托管资源。"
keywords: "nb env remove,NocoBase CLI,删除环境,移除配置,purge"
---

# nb env remove

移除一个已配置的 env。对于 local/docker env，该命令会先停止当前机器上 CLI 托管的应用运行态和内置数据库运行态，再移除已保存的 CLI env 配置。对于 http/ssh env，该命令只会移除已保存的 CLI env 配置。

如果被移除的是当前 env，CLI 会在剩余 env 里自动选择一个新的 current env；如果已经没有可用 env，则 current env 会被清空。

默认情况下，命令会要求确认。在非交互模式下，必须显式传入 `--force` 才能执行。

如需尽可能清理当前机器上的 CLI 托管资源，可传入 `--purge`。对于 local/docker env，`--purge` 会一并清理托管运行资源、storage 数据以及适用时的下载型本地 app 文件；对于 http/ssh env，`--purge` 不会触碰外部服务，只会移除已保存的 CLI env 配置。

## 用法

```bash
nb env remove <name> [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `<name>` | string | 要移除的已配置环境名称 |
| `--force`, `-f` | boolean | 跳过当前 remove 模式下的确认；在非交互模式下必填 |
| `--purge` | boolean | 额外清理当前机器上的 CLI 托管资源、storage 数据以及适用时的下载型本地 app 文件；对于 remote API env，只会移除已保存的 env 配置 |
| `--verbose` | boolean | 显示详细进度 |

## 示例

```bash
nb env remove staging
nb env remove staging --force
nb env remove staging --purge --force
```

## 相关命令

- [`nb app stop`](../app/stop.md)
- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
