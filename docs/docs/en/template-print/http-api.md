---
title: "Template Print HTTP API"
description: "NocoBase Template Print HTTP API: use the templatePrint action to print selected records, current filtered results, or all matching data, and download generated Word, Excel, PowerPoint, or PDF files."
keywords: "template print,HTTP API,templatePrint,PDF,print selected records,print all,NocoBase"
---

# HTTP API

Template printing can be triggered directly through the HTTP API. Whether you are printing from a detail block or a table block, the underlying call is the `templatePrint` action on the current business resource.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Notes:

- `<resource_name>` is the resource name of the current collection.
- The API returns a binary file stream rather than JSON.
- The caller must have query permission for the current resource and permission to use the corresponding template print button.
- You must pass a user-login-based JWT token in the `Authorization` header, otherwise access will be denied.

## Request body parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `templateName` | `string` | Yes | Template name, corresponding to the template identifier configured in template management. |
| `blockName` | `string` | Yes | Block type. Use `table` for table blocks and `details` for detail blocks. |
| `timezone` | `string` | No | Time zone, for example `Asia/Shanghai`. Used for date and time rendering in templates. |
| `uid` | `string` | No | Schema UID of the template print button, used for permission checks. |
| `convertedToPDF` | `boolean` | No | Whether to convert the result to PDF. If `true`, the API returns a `.pdf` file. |
| `queryParams` | `object` | No | Query parameters passed to the underlying data query. |
| `queryParams.page` | `number \| null` | No | Page number. Set it to `null` to disable page slicing. |
| `queryParams.pageSize` | `number \| null` | No | Page size. Set it to `null` to disable page slicing. |
| `queryParams.filter` | `object` | No | Filter conditions. These are automatically merged with ACL fixed filters. |
| `queryParams.appends` | `string[]` | No | Association fields to append in the query. |
| `queryParams.filterByTk` | `string \| object` | No | Commonly used in detail blocks to specify the primary key value. |
| Other parameters such as `queryParams.sort` | `any` | No | Any other query parameters are passed through to the underlying resource query as-is. |

## Table block

Table blocks use the same endpoint, with `blockName: "table"` indicating list-print mode. The server runs a `find` query on the resource and passes the result array into the template.

### Print selected records or current page results

This is suitable when printing selected rows from a table block, or when preserving the current page context for printing. The common approach is:

- Set `queryParams.page` and `queryParams.pageSize` to the current table page and page size.
- Build `filter.id.$in` from the primary keys of the selected records.

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

This request means:

- `blockName` is `table`, so the template is rendered with list data.
- `filter.id.$in` specifies the set of records to print.
- `page` and `pageSize` preserve the current paging context so the behavior matches the UI.
- `appends` can be used to include additional associations when needed.

### Print all matching data

This is suitable for the "Print all records" action in a table block. In this mode, the API no longer limits the query to the current page, and instead loads all data matching the current filter conditions.

The key point is to explicitly set `queryParams.page` and `queryParams.pageSize` to `null`.

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

This request means:

- `page: null` and `pageSize: null` disable pagination.
- `filter: {}` means no extra filter is added. If the UI already has filter conditions, you can pass them here directly.
- The server queries all matching data and renders the template in batch.

> Note: a table block can print at most 300 records in a single request. If the limit is exceeded, the API returns a `400` error.

## Detail block

Detail blocks use the same `templatePrint` action, but usually pass:

- `blockName: "details"`
- `queryParams.filterByTk` to identify the current record
- `queryParams.appends` to specify additional associations to load

The server then runs a `findOne` query on the resource and passes the result object into the template.

## Response

When the call succeeds, the API directly returns a file stream. Typical response headers look like this:

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Notes:

- If `convertedToPDF` is `true`, the returned file extension is `.pdf`.
- Otherwise, the API returns the original template type, such as `.docx`, `.xlsx`, or `.pptx`.
- Frontends usually trigger the browser download based on the filename in `Content-Disposition`.

## Additional resources

- [Using API keys in NocoBase](../integration/api-keys/usage.md)