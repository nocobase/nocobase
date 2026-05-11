---
title: "nb env status"
description: "nb env status 命令参考：查看当前 env、指定 env 或全部 env 的状态。"
keywords: "nb env status,NocoBase CLI,环境状态,API Base URL"
---

# nb env status

查看 env 状态。默认查看当前 env，也可以查看指定 env，或者用 `--all` 查看全部 env。

这个命令会输出精简后的状态表，包含 `Env`、`Status` 和 `API Base URL` 三列。

## 用法

```bash
nb env status [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要查看的已配置环境名称；省略时使用当前 env，且不能与 `--all` 一起使用 |
| `--all` | boolean | 查看所有已配置 env 的状态 |
| `--json-output` | boolean | 以 JSON 输出结果 |

`[name]` 和 `--all` 不能同时使用。

## 状态说明

`Status` 表示 CLI 检查目标 env 后得到的结果。通常会看到以下几种值：

- `ok`：可以正常访问。
- `auth failed`：API 地址可达，但认证失败。
- `unreachable`：无法连接目标地址。
- `unconfigured`：env 配置不完整。
- `missing`：对应的托管应用已经不存在。

## 示例

```bash
nb env status
nb env status app1
nb env status --all
nb env status --all --json-output
```

## 相关命令

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
