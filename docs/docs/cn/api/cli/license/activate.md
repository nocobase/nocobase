---
title: "nb license activate"
description: "nb license activate 命令参考：为指定 env 激活 NocoBase 商业授权。"
keywords: "nb license activate,NocoBase CLI,商业授权激活"
---

# nb license activate

为指定 env 激活商业授权。可以直接提供已有 license key，也可以通过在线服务申请并激活。

## 用法

```bash
nb license activate [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名称；省略时使用当前 env |
| `--key` | string | 直接传入已有的 license key |
| `--key-file` | string | 从文件读取 license key |
| `--online` | boolean | 在线申请并激活 license |
| `--account` | string | 在线激活使用的授权服务账号 |
| `--password` | string | 在线激活使用的授权服务密码 |
| `--desc` | string | 在线激活时提交的应用名称 |
| `--yes` | boolean | 当显式 `--env` 指向的 env 与当前 env 不一致时，跳过交互确认 |
| `--json` | boolean | 输出 JSON |

## 示例

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## 说明

执行在线激活时，CLI 会基于当前 env 的实例 ID 和应用地址向授权服务申请 key。

如果显式传入 `--env`，并且它与当前 env 不一致，CLI 会先要求确认；在非交互终端或 AI agent 场景下，需要由你自己显式追加 `--yes`，或者先执行 `nb env use <name>` 再重试。

## 相关命令

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
