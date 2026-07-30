---
title: "数据与 API"
description: "AI Portal 如何通过 REST API 读写 NocoBase 的业务数据，包括 Refine data provider 的对接方式和多数据源支持。"
keywords: "AI Portal,数据,REST API,Refine,data provider,多数据源,过滤,分页"
---

# 数据与 API

:::tip 前置条件

阅读本页前，请确保你已按照 [AI 搭建快速开始](./index.md) 跑通了第一个 Portal。

:::

数据表在 NocoBase 里建好之后，增删改查接口自动就有了。Portal 模板已经把这些接口对接完成，页面里直接用 Refine 的 hook 取数即可。

## 取数的基本写法

模板用 [Refine](https://refine.dev/docs/) 做数据层。取一个列表：

```tsx
import { useList } from "@refinedev/core";

const { result } = useList({
  resource: "customers", // 对应 NocoBase 里的数据表名
  pagination: { currentPage: 1, pageSize: 20 },
  sorters: [{ field: "createdAt", order: "desc" }],
  filters: [{ field: "name", operator: "contains", value: "张" }],
});
```

`resource` 填数据表名，剩下的分页、排序、过滤都交给 data provider 翻译成 NocoBase 的 API 参数。其他常用 hook 有 `useOne`（取单条）、`useCreate`、`useUpdate`、`useDelete`，用法参考 Refine 官方文档。

## 过滤条件怎么翻译

Refine 的 operator 会被转成 NocoBase 的过滤语法，对照关系是：

| Refine operator | NocoBase | 含义 |
| --- | --- | --- |
| `eq` / `ne` | `$eq` / `$ne` | 等于 / 不等于 |
| `lt` / `lte` | `$lt` / `$lte` | 小于 / 小于等于 |
| `gt` / `gte` | `$gt` / `$gte` | 大于 / 大于等于 |
| `in` / `nin` | `$in` / `$notIn` | 在集合内 / 不在集合内 |
| `contains` | `$includes` | 包含 |
| `startswith` / `endswith` | `$startsWith` / `$endsWith` | 以……开头 / 结尾 |
| `null` / `nnull` | `$null` / `$notNull` | 为空 / 不为空 |
| `between` / `nbetween` | `$between` / `$notBetween` | 在区间内 / 不在区间内 |

嵌套的 `and` / `or` 条件组也支持，写法跟 Refine 标准用法一致。

## 关联字段

默认返回的数据不包含关联表的内容。需要带上时用 `meta.appends`：

```tsx
const { result } = useList({
  resource: "orders",
  meta: {
    appends: ["customer", "items"], // 带上关联的客户和订单项
  },
});
```

只想要部分字段时用 `meta.fields`，能减少传输量：

```tsx
const { result } = useList({
  resource: "customers",
  meta: { fields: ["id", "name", "phone"] },
});
```

## 多数据源

NocoBase 支持连接外部数据库。取非主数据源的数据时，用 `meta.dataSourceKey` 指定：

```tsx
const { result } = useList({
  resource: "legacy_orders",
  meta: { dataSourceKey: "external-mysql" },
});
```

这个值会作为 `X-Data-Source` 请求头发出去，权限判断也会跟着走对应数据源的 ACL。

## 直接调 API

Refine 的 hook 覆盖不了的场景——比如自定义的接口、批量操作——可以用底层的客户端：

```tsx
import { nocobaseClient } from "@/lib/nocobase/client";

// 调用 customers 资源的自定义 action
const result = await nocobaseClient.action("customers", "export", {
  method: "POST",
  body: { ids: [1, 2, 3] },
});
```

`NocoBaseClient` 会自动带上认证信息、语言和时区，不需要自己拼请求头。

## 照着示例写

`src/extensions/nocobase-users-example` 是一个完整的增删改查模块，基于 NocoBase 标准的 `users` 数据表：

| 文件 | 内容 |
| --- | --- |
| `list.tsx` | 列表页，表格、排序、筛选、行内操作按钮 |
| `create.tsx` | 创建页，表单和校验 |
| `edit.tsx` | 编辑页 |
| `show.tsx` | 详情页 |
| `routes.ts` | 路由路径定义和路径生成函数 |
| `extension.tsx` | 扩展注册，声明资源和路由 |
| `types.ts` | 数据类型定义 |

做新页面时让 AI 参考它，比从零描述省事得多：

```
参考 nocobase-users-example 的写法，做一个 customers 的增删改查模块
```

## 常见问题

**接口 404 或者路径不对？**

检查 `NOCOBASE_API_URL` 有没有带 `/api` 后缀。这是最常遇到的问题——写成 `http://localhost:13000` 是不行的，得是 `http://localhost:13000/api`。

**开发时跨域？**

如果 `NOCOBASE_API_URL` 填的是绝对地址，Vite 会自动配代理转发，正常情况下不用管。如果还是有问题，确认 NocoBase 服务确实在那个地址上跑着。

**登录状态莫名丢失？**

服务端如果定制过 token 的存储方式，Portal 这边要保持一致，对齐 `API_CLIENT_STORAGE_PREFIX`、`API_CLIENT_STORAGE_TYPE` 和 `API_CLIENT_SHARE_TOKEN` 三个变量。详见[项目结构与技术栈](./project-structure.md#环境变量)。

**列表能查到数据，但某些字段是空的？**

关联字段需要用 `meta.appends` 显式带上，默认不返回。

## 相关链接

- [AI 搭建快速开始](./index.md) — 跑通第一个由 AI 编写的前端入口
- [认证与权限](./auth-acl.md) — 请求携带的身份信息和权限校验
- [项目结构与技术栈](./project-structure.md) — 环境变量和目录约定
- [标准组件与扩展](./components.md) — 扩展怎么写、怎么注册资源
- [与 AI Agent 协作搭建](./agent-workflow.md) — 让 AI 照着示例扩展写新页面
- [数据源](../data-sources/index.md) — NocoBase 的数据源管理能力
- [数据建模](../ai-builder/data-modeling.md) — 用 AI 设计数据表和关联关系
