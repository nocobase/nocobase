---
order: 3
nav:
  path: /
group:
  title: 开发指南
  order: 3
---

# HTTP API 设计

NocoBase 的 HTTP API 基于 Resource 和 Action 设计，是 REST API 的超集，请求方法不局限于增删改查，在 NocoBase 里，Resource Action 可以任意的扩展。

## 资源 Resource

在 NocoBase 里，资源（resource）有两种表达方式：

- `<collection>`
- `<collection>.<association>`

<Alert>

- collection 是所有抽象数据的集合
- association 为 collection 数据的关联数据
- resource 包括 collection 和 collection.association 两类

</Alert>

示例

- `posts` 文章
- `posts.user` 文章用户
- `posts.tags` 文章标签

## 操作 Action

以 `:<action>` 的方式表示资源操作

- `<collection>:<action>`
- `<collection>.<association>:<action>`

内置的全局操作，可用于 collection 或 association

- `create`
- `get`
- `list`
- `update`
- `destroy`
- `move`

内置的关联操作，仅用于 association

- `set`
- `add`
- `remove`
- `toggle`

示例

- `posts:create` 创建文章
- `posts.user:get` 查看文章用户
- `posts.tags:add` 附加文章标签（将现有的标签与文章关联）

## 请求 URL

```bash
<GET|POST>   /api/<collection>:<action>
<GET|POST>   /api/<collection>/<collectionId>/<association>:<action>
```

