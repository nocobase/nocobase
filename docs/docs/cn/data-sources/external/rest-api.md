---
title: "REST API 数据源"
description: "接入第三方 REST API，把接口资源映射为 NocoBase 数据表，并配置 List、Get、Create、Update、Destroy 接口。"
keywords: "REST API 数据源,外部 API,接口映射,Collection 映射,CRUD,NocoBase"
---

# REST API 数据源

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

REST API 数据源用于把第三方 HTTP API 接入 NocoBase。你可以把一个 RESTful 资源映射成 NocoBase 数据表，再在页面区块、权限和工作流中使用它。

它适合这些场景：

- 第三方系统只提供 HTTP API，不提供数据库访问
- 需要实时读取或写入外部系统数据
- 不希望把外部数据同步到 NocoBase 数据库
- 需要通过 API 复用第三方系统已有业务逻辑

## 安装

REST API 数据源是商业插件。启用插件后，可以在「数据源管理」的「Add new」菜单中选择「REST API」。

添加数据源时，通常需要准备 Base URL、请求头、数据源级变量和超时时间。认证信息、租户标识或环境变量可以放在请求头或数据源变量中，避免在每个接口里重复填写。

## 添加 Collection

REST API 数据源中的 Collection 对应第三方 API 的一个资源。比如第三方系统的用户资源可能有这些接口：

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

在 NocoBase 中，需要把这些接口分别映射为数据表的 List、Get、Create、Update、Destroy 操作。

| 操作 | 是否必需 | 说明 |
| --- | --- | --- |
| List | 必需 | 获取资源列表，用于表格、列表、选择器等区块。 |
| Get | 必需 | 获取单条记录详情，用于详情、编辑、关联数据等场景。 |
| Create | 可选 | 创建记录。只有需要新增数据时配置。 |
| Update | 可选 | 更新记录。只有需要编辑数据时配置。 |
| Destroy | 可选 | 删除记录。只有需要删除数据时配置。 |

默认先配置 List 和 Get。确认读取和字段映射正确后，再继续配置 Create、Update、Destroy。

## 请求参数映射

第三方 API 的分页、过滤、排序参数不一定和 NocoBase 一致。你需要把 NocoBase 请求变量映射到第三方 API 的参数中。

| 变量 | 说明 |
| --- | --- |
| `request.params.page` | 当前页码。 |
| `request.params.pageSize` | 每页数量。 |
| `request.params.filter` | 过滤条件。 |
| `request.params.sort` | 排序规则。 |
| `request.params.fields` | 只返回哪些字段。 |
| `request.params.except` | 排除哪些字段。 |
| `request.params.filterByTk` | 单条记录的唯一标识，Get、Update、Destroy 通常会用到。 |
| `request.body` | Create 或 Update 提交的数据。 |

比如第三方 API 使用 `page` 和 `limit` 作为分页参数，就可以把它们分别映射到 `request.params.page` 和 `request.params.pageSize`。

## 响应转换

第三方 API 的响应格式可能不是 NocoBase 标准格式。你需要配置响应转换，把第三方 API 返回的数据转换成 NocoBase 可以识别的结构。

常见转换内容包括列表数据的位置、总记录数、单条记录数据、错误信息和字段提取结果。

如果接口响应格式比较复杂，建议先用「Try it out」调试 List 和 Get，确认返回数据稳定后再配置字段。

## 配置字段

REST API 数据源需要从接口响应中提取字段元数据。字段配置完成后，NocoBase 才能在页面里正确展示、筛选和编辑这些数据。

字段配置时需要重点确认：

| 配置 | 说明 |
| --- | --- |
| Field display name | 字段在界面中显示的名称。 |
| Field name | 字段在响应数据中的名称或映射后的内部名称。 |
| Field type | 字段在数据层的类型。 |
| Field interface | 字段在界面中的展示和输入方式。 |
| Record unique key | 用来定位单条记录的唯一字段，通常对应第三方 API 中的 ID。 |

:::warning 注意

REST API 数据源的稳定性取决于第三方 API。接口字段名称、响应结构、认证方式或分页规则变化后，需要及时回到 NocoBase 更新映射配置。

:::

## 使用建议

| 场景 | 建议 |
| --- | --- |
| 只展示外部数据 | 只配置 List 和 Get，降低写入风险。 |
| 需要写入外部系统 | 继续配置 Create、Update、Destroy，并充分调试错误响应。 |
| 第三方 API 响应不稳定 | 在响应转换中处理空值、错误格式和字段缺失。 |
| 需要和页面区块配合 | 先确认 Record unique key，再添加表格、详情和表单区块。 |

## 相关链接

- [REST API 和外部 NocoBase 对比](../rest-api-vs-external-nocobase.md) — 判断什么时候使用 REST API 数据源
- [字段](../field.md) — 了解字段元数据和 Field interface
- [数据表](../collection.md) — 了解数据表在 NocoBase 中的作用
