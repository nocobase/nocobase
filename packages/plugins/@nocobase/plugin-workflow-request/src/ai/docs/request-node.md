---
title: "HTTP 请求"
description: "说明 HTTP 请求节点的方法、参数、请求体格式与示例。"
---

# HTTP 请求

## 节点类型

`request`
请使用以上 `type` 值创建节点，不要使用文档文件名作为 type。

## 节点描述
向指定 URL 发送 HTTP 请求，并返回响应结果。

## 业务场景举例
调用支付、物流等外部系统接口。

## 配置项列表
| 字段 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| method | string | POST | 是 | HTTP 方法：GET/POST/PUT/PATCH/DELETE。 |
| url | string | 无 | 是 | 请求地址，支持变量模板。 |
| contentType | string | application/json | 否 | 请求体类型：`application/json`、`application/x-www-form-urlencoded`、`multipart/form-data`、`application/xml`、`text/plain`。 |
| headers | array | [] | 否 | 请求头列表，每项 `{ name, value }`，`Content-Type` 会被忽略。 |
| params | array | [] | 否 | URL 参数列表，每项 `{ name, value }`。 |
| data | any | 无 | 否 | 请求体，格式随 `contentType` 变化，见下方说明。 |
| timeout | number | 5000 | 否 | 超时时间（毫秒）。 |
| ignoreFail | boolean | false | 否 | 请求失败是否忽略并继续流程。 |
| onlyData | boolean | false | 否 | 仅返回 `data` 字段（接口返回体），默认返回完整响应信息。 |

### data 格式说明
- `application/json`：对象或数组。
- `application/x-www-form-urlencoded`：数组 `[{ name, value }]`。
- `multipart/form-data`：数组 `[{ name, valueType: 'text'|'file', text?, file? }]`，文件支持附件记录或数组。
- `application/xml` / `text/plain`：字符串。

## 分支说明
不支持分支。

## 示例配置
```json
{
  "method": "POST",
  "url": "https://api.example.com/v1/orders",
  "contentType": "application/json",
  "headers": [
    { "name": "Authorization", "value": "Bearer {{ $context.data.token }}" }
  ],
  "params": [
    { "name": "sync", "value": "true" }
  ],
  "data": {
    "title": "{{ $context.data.title }}",
    "amount": 100
  },
  "timeout": 10000,
  "ignoreFail": false
}
```