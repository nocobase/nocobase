---
title: "nb env list"
description: "nb env list 命令参考：列出已配置的 NocoBase CLI env。"
keywords: "nb env list,NocoBase CLI,环境列表,API Base URL"
---

# nb env list

列出所有已配置的 env。

这个命令只展示配置本身，不再主动检查应用状态。想看状态时，默认用 [`nb env status`](./status.md) 就行。

## 用法

```bash
nb env list
```

## 输出

输出表格包含当前环境标记、名称、类型、`API Base URL`、认证方式和运行时版本。

其中：

- `Current` 用 `*` 标记当前生效的 env
- `API Base URL` 显示 env 保存的原始 API 地址
- `Runtime` 显示缓存的运行时版本信息

## 示例

```bash
nb env list
```

## 相关命令

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
