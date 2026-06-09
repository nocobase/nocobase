---
pkg: '@nocobase/plugin-app-supervisor'
title: '调用子应用 API'
description: '多应用中的子应用 API 调用方式：通过入口应用访问子应用 API，使用路径前缀、请求头或查询参数指定目标子应用。'
keywords: '多应用,子应用 API,AppSupervisor,入口应用,API 调用,NocoBase'
---

# 调用子应用 API

在多应用场景中，每个子应用都有自己独立的 API。调用子应用 API 时，需要让入口应用知道当前请求要转发到哪个子应用。

例如，主应用的 API 地址通常是：

```bash
GET /api/users:list
```

其中 `/api` 为默认的的 API 前缀，可以通过环境变量 `API_BASE_PATH` 自定义。

如果要调用某个子应用的同名 API，需要在请求中指定子应用名称。

## 使用路径前缀

推荐使用 `/api/__app/<appName>/` 前缀调用子应用 API：

```bash
GET /api/__app/a_xxx/users:list
```

其中：

- `a_xxx` 是子应用名称
- `users:list` 是要调用的资源和操作
- `/api` 是当前系统的 API 基础路径

带查询参数时，可以继续追加在后面：

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

这种方式比较直观，也适合在多环境部署中统一从入口应用调用子应用 API。

## 使用请求头指定子应用

如果调用方已经固定使用 `/api/...` 地址，也可以通过 `X-App` 请求头指定子应用：

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

这种方式适合后端服务调用，或前端请求工具已经统一封装 API 地址，只需要额外添加请求头的场景。

## 使用查询参数指定子应用

也可以通过 `__appName` 查询参数指定子应用：

```bash
GET /api/users:list?__appName=a_xxx
```

如果同时还有其他查询参数，可以一起传递：

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

一般情况下，建议优先使用路径前缀或请求头方式，因为目标子应用更加明确。

## 多环境部署中的调用地址

在多环境部署中，通常会有一个入口应用和多个运行环境。

例如：

- 入口应用地址：`http://localhost:13003`
- 某个运行环境地址：`http://localhost:14000`

调用子应用 API 时，建议优先通过入口应用访问：

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

入口应用会根据应用配置将请求路由到对应的子应用。如果明确知道自己要访问某个运行环境，也可以使用运行环境地址调用。

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## 子应用独立域名

如果子应用配置了自己的访问域名，也可以直接通过该域名调用子应用自己的 API：

```bash
GET https://app-example.example.com/api/users:list
```

如果希望统一走入口应用，则仍然可以使用入口应用的 `/api/__app/<appName>/...` 地址。

## 认证说明

调用子应用 API 时，权限校验仍然以目标子应用为准。

也就是说：

- 需要使用对子应用有效的登录态或访问令牌
- 主应用的登录态不会自动等同于子应用的 API 权限

如果请求没有携带有效认证信息，子应用会按自己的认证配置返回未登录或无权限错误。
