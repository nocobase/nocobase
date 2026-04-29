---
title: "nb env list"
description: "nb env list 命令参考：列出已配置的 NocoBase CLI env 和 API 认证状态。"
keywords: "nb env list,NocoBase CLI,环境列表,认证状态"
---

# nb env list

列出所有已配置的 env，并使用已保存的 Token/OAuth 凭证检查应用 API 认证状态。

## 用法

```bash
nb env list
```

## 输出

输出表格包含当前环境标记、名称、类型、App Status、URL、认证方式和运行时版本。

`App Status` 表示 CLI 使用当前 env 的认证信息访问应用 API 后得到的状态，例如 `ok`、`auth failed`、`unreachable` 或 `unconfigured`。数据库运行状态请使用 [`nb db ps`](../db/ps.md) 查看。

## 示例

```bash
nb env list
```

## 相关命令

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
