---
title: "nb env auth"
description: "nb env auth 命令参考：对已保存的 NocoBase env 执行 OAuth 登录。"
keywords: "nb env auth,NocoBase CLI,OAuth,登录,认证"
---

# nb env auth

对指定 env 执行 OAuth 登录。省略环境名称时使用当前 env。

## 用法

```bash
nb env auth [name]
```

## 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `[name]` | string | 环境名称，省略时使用当前 env |

## 说明

内部使用 PKCE 流程：启动本地回调服务，打开浏览器授权，交换 token，并保存到配置文件。

## 示例

```bash
nb env auth
nb env auth prod
```

## 相关命令

- [`nb env add`](./add.md)
- [`nb env update`](./update.md)
