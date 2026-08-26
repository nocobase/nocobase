---
title: "nb license activate"
description: "nb license activate 命令参考：为指定 env 激活已有的 NocoBase 商业 license key。"
keywords: "nb license activate,NocoBase CLI,商业授权激活"
---

# nb license activate

为指定 env 激活已有的商业 license key。支持直接传入、从文件读取，或在交互终端中粘贴。

## 用法

```bash
nb license activate [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--key` | string | 直接传入已有的商业 license key |
| `--key-file` | string | 从文件读取已有的商业 license key |
| `--yes`, `-y` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## 说明

交互式执行时，CLI 会先展示当前实例的 Hostname 和 Instance ID，然后提示你直接粘贴 license key 或输入 key 文件路径。这两项信息可用于核对当前授权绑定是否正确。

激活成功后，需要重启应用让授权和商业插件状态真正生效；CLI 会在重启前自动同步当前授权允许使用的商业插件：

```bash
nb app restart
```

如果显式传入 `--env`，并且它与当前 env 不一致，CLI 会先要求确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
