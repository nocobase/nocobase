---
title: "模板打印 HTTP API"
description: "NocoBase 模板打印 HTTP API：通过 templatePrint 动作打印选中记录、当前筛选结果或全部符合条件的数据，并下载生成的 Word、Excel、PowerPoint 或 PDF 文件。"
keywords: "模板打印,HTTP API,templatePrint,PDF,打印选中记录,打印全部,NocoBase"
---

# HTTP API

模板打印支持通过 HTTP API 直接触发文档渲染与下载。无论是详情区块还是表格区块，本质上都是对当前业务资源发起 `templatePrint` 动作。

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

说明：
- `<resource_name>` 为当前数据表对应的资源名。
- 接口返回的是二进制文件流，而不是 JSON 数据。
- 调用方需要具备当前资源的查询权限，以及对应模板打印按钮的使用权限。
- 调用接口需要通过 Authorization 请求头传递基于用户登录的 JWT 令牌，否则将被拒绝访问。

## 请求体参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `templateName` | `string` | 是 | 模板名称，对应模板管理中配置的模板标识。 |
| `blockName` | `string` | 是 | 区块类型。表格区块传 `table`，详情区块传 `details`。 |
| `timezone` | `string` | 否 | 时区，例如 `Asia/Shanghai`。用于模板中的日期时间渲染。 |
| `uid` | `string` | 否 | 模板打印按钮的 schema uid，用于权限校验。 |
| `convertedToPDF` | `boolean` | 否 | 是否转换为 PDF。传 `true` 时返回 `.pdf` 文件。 |
| `queryParams` | `object` | 否 | 传递给底层数据查询的参数。 |
| `queryParams.page` | `number \| null` | 否 | 分页页码。设为 `null` 表示不按页截取。 |
| `queryParams.pageSize` | `number \| null` | 否 | 每页条数。设为 `null` 表示不按页截取。 |
| `queryParams.filter` | `object` | 否 | 过滤条件，会与 ACL 固定过滤条件自动合并。 |
| `queryParams.appends` | `string[]` | 否 | 需要附加查询的关联字段。 |
| `queryParams.filterByTk` | `string \| object` | 否 | 详情区块常用，用于指定主键值。 |
| `queryParams.sort` 等其他参数 | `any` | 否 | 其他查询参数会原样透传到底层资源查询。 |

## 表格区块

表格区块使用同一个接口，通过 `blockName: "table"` 指定列表打印模式。服务端会对资源执行 `find` 查询，并把结果数组传入模板。

### 打印选中记录或当前页结果

适用于从表格区块中勾选部分记录进行打印，或者保留当前页分页上下文进行打印。常见做法是：

- 将 `queryParams.page` 和 `queryParams.pageSize` 设置为当前表格页码与每页条数。
- 将勾选记录的主键拼成 `filter.id.$in` 条件。

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

这类请求的含义如下：

- `blockName` 为 `table`，表示按列表数据渲染模板。
- `filter.id.$in` 用于指定需要打印的记录集合。
- `page` 与 `pageSize` 保留当前分页上下文，便于与界面行为一致。
- `appends` 可以按需补充关联字段。

### 打印全部符合条件的数据

适用于点击表格区块中的“打印全部记录”时的调用方式。此时不再按当前页分页截取，而是直接拉取所有符合当前筛选条件的数据。

关键点是将 `queryParams.page` 和 `queryParams.pageSize` 显式传为 `null`。

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Shanghai",
		"uid": "ixs3fx3x6is"
	}'
```

这类请求的含义如下：

- `page: null` 与 `pageSize: null` 表示取消分页限制。
- `filter: {}` 表示不额外附加筛选条件；如果界面上已有筛选条件，也可以直接放入这里。
- 服务端会查询全部符合条件的数据并批量渲染模板。

> 注意：表格区块单次最多打印 300 条记录。超过限制时，接口会返回 `400` 错误。

## 详情区块

详情区块同样使用 `templatePrint` 动作，但通常传入：

- `blockName: "details"`
- `queryParams.filterByTk` 指定当前记录主键
- `queryParams.appends` 指定需要追加查询的关联字段

服务端会对资源执行 `findOne` 查询，并把结果对象传入模板。

## 返回结果

调用成功后，接口直接返回文件流，典型响应头如下：

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

说明：

- 当 `convertedToPDF` 为 `true` 时，返回文件扩展名为 `.pdf`。
- 否则返回模板原始类型对应的文件，例如 `.docx`、`.xlsx` 或 `.pptx`。
- 前端通常根据 `Content-Disposition` 中的文件名触发浏览器下载。

## 其他资源
- [在 NocoBase 中使用 API 密钥](../integration/api-keys/usage.md)