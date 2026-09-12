---
title: "nb env auth"
description: "nb env auth 命令参考：对已保存的 NocoBase env 执行 basic、token 或 OAuth 认证。"
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,登录,认证"
---

# nb env auth

对已保存的 NocoBase env 重新执行认证，或更新它保存的认证信息。省略环境名称时使用当前 env。

`nb env auth` 支持三种认证方式：`basic`、`token`、`oauth`。如果不传 `--auth-type`，CLI 会优先根据你传入的认证参数判断；仍然无法判断时，会使用 env 中已保存的认证方式。

## 用法

```bash
nb env auth [name] [flags]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 要登录的已配置环境名称；省略时使用当前 env |
| `--auth-type`, `-a` | string | 认证方式：`basic`、`token` 或 `oauth` |
| `--access-token`, `-t` | string | `token` 认证使用的 API key 或 access token |
| `--username` | string | `basic` 认证使用的用户名；在 TTY 中省略时会提示 |
| `--password` | string | `basic` 认证使用的密码；在 TTY 中省略时会提示 |

## 兼容参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `--env`, `-e` | string | 环境名称，等同于 `[name]`。这是为了兼容其他命令保留的隐藏参数，通常直接使用位置参数就够了 |

## 说明

几种认证方式的处理逻辑如下：

- `basic`：使用用户名和密码登录 NocoBase，保存登录后返回的 access token 和用户名
- `token`：把 `--access-token` 传入的 API key 或 access token 保存到 env 中
- `oauth`：进入浏览器认证流程，认证完成后保存 access token

如果当前终端可以交互，省略 `--auth-type`、`--username`、`--password` 或 `--access-token` 时，CLI 会按需提示你输入。非交互模式下使用 `basic` 认证时，必须同时传入 `--username` 和 `--password`。

`oauth` 认证会优先尝试 Device Authorization Grant。当 OAuth 服务端支持这个流程时，命令会在终端输出验证 URL 和用户代码，并轮询等待浏览器端完成授权。这个模式不需要本地回调监听，适合远程服务器或无界面环境。

如果 OAuth 服务端没有暴露 device authorization endpoint，命令会回退到 PKCE loopback 流程：启动本地回调服务，打开浏览器授权，交换 token，并保存到配置文件。

认证完成后，CLI 会自动执行一次 `nb env update <name>`，让 env 的状态重新同步。

## 限制

- `[name]` 和 `--env` 不能同时传入不同的环境名称
- `--access-token` 不能和 `--username` 或 `--password` 一起使用
- `--auth-type oauth` 不能和 `--access-token`、`--username` 或 `--password` 一起使用
- `--auth-type token` 不能和 `--username` 或 `--password` 一起使用
- `--auth-type basic` 不能和 `--access-token` 一起使用
- `--access-token`、`--username`、`--password` 传入后不能为空

## 示例

```bash
# 使用当前 env 中保存的认证方式重新认证
nb env auth

# 对指定 env 重新认证
nb env auth prod

# 使用 OAuth 浏览器登录
nb env auth prod --auth-type oauth

# 使用用户名和密码登录
nb env auth prod --auth-type basic --username admin --password secret

# 保存 API key 或 access token
nb env auth prod --auth-type token --access-token <api-key>
```

使用 device authorization 时，打开命令输出的 URL，并在浏览器中输入终端显示的 code。

## 相关命令

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
