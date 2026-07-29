---
title: "nb portal registry"
description: "nb portal registry 命令参考：管理 AI Portal 工作区中由插件提供的 Portal Registry 项。"
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

管理 AI Portal 工作区中的 NocoBase Portal Registry 项。服务端已启用的插件可以提供可复用的前端集成，例如组件、Hook、适配器和 Demo 页面；Registry 命令负责把这些集成安装到 Portal 源码中。

## 用法

```bash
nb portal registry <command>
```

## 子命令

| 命令 | 说明 |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | 安装或更新 NocoBase 已启用插件提供的 Registry 项 |

## 使用条件

- Portal 工作区必须已经创建，并包含 `package.json` 和 `components.json`。
- 所选 NocoBase env 必须提供 Portal Registry API。
- 只有已启用插件提供的 Registry 项可以安装。

## 示例

把所有可用的 Registry 项安装到 `customer` Portal：

```bash
nb portal registry sync customer
```

只安装指定项：

```bash
nb portal registry sync customer ai acl auth-sms
```

## 相关命令

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
