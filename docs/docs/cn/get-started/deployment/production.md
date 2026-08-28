---
title: "NocoBase 生产环境部署"
description: "NocoBase 生产部署流程：推荐 Docker 或 create-nocobase-app，静态资源代理（Nginx/Caddy/CDN）、docker compose/pm2 运维命令。"
keywords: "生产环境部署,生产部署,Docker 部署,静态资源代理,Nginx,Caddy,运维命令,NocoBase"
---

# 生产环境部署

在生产环境中部署 NocoBase 时，由于不同系统和环境的构建方式存在差异，安装依赖可能较为繁琐。为获得完整功能体验，我们推荐使用 **Docker** 进行部署。如果系统环境无法使用 Docker，也可以使用 **create-nocobase-app** 进行部署。

:::warning 注意

不建议直接在生产环境中使用源码部署。源码依赖较多、体积庞大，且全量编译对 CPU 和内存要求较高。如果确实需要使用源码部署，建议先构建自定义 Docker 镜像，再进行部署。

:::

:::warning 注意

如果要部署多个彼此独立的 NocoBase 服务，请为每个服务使用不同的 `hostname`（比如不同的子域名），不要只通过端口区分服务，如 `https://example.com:13000` 和 `https://example.com:14000`。

NocoBase 会使用 cookie 维持登录状态和[文件访问权限](../../file-manager/stable-url.md)。浏览器发送 cookie 时不会按端口隔离，同一 `hostname` 下不同端口的服务可能共享同名 cookie，导致登录状态互相覆盖，或出现文件预览、下载鉴权失败等问题。

同一个 NocoBase 部署环境内的子应用不在这个限制范围内。登录 cookie 会按应用名区分，主应用和不同名称的子应用可以共享同一个 `hostname`。

不过不能据此忽略独立服务之间的隔离。如果在同一 `hostname` 的另一个端口运行了另一个 NocoBase 服务，并且其中存在同名主应用或子应用，cookie 仍可能冲突。

推荐分别使用 `app1.example.com` 和 `app2.example.com`，再通过 Nginx 或 Caddy 反向代理到不同的 NocoBase 服务。

:::

## 前后端分离 / 跨源访问 API

推荐让页面和 API 保持同源：通过同一域名下的反向代理，把 `${APP_PUBLIC_PATH}api/` 和 `${APP_PUBLIC_PATH}files/` 转发到 NocoBase 服务，`API_BASE_URL` 留空。

如果页面必须跨源访问 API（配置了指向其他源的 `API_BASE_URL`），需要把页面来源加入 `CORS_ORIGIN_WHITELIST`，否则浏览器会忽略 API 响应中的 `Set-Cookie`，登录 cookie 无法写入，文件稳定 URL 的预览和下载会鉴权失败。

同时注意 cookie 按 `hostname` 存储：页面与 API 域名完全不同时，从页面域名访问 `/files/` 不会携带 API 域名下的登录 cookie，这类部署应改为同源反向代理。详见[环境变量](../installation/env.md#api_base_url)。

## 部署流程

生产环境的部署可参考已有的安装和升级步骤。

### 全新安装

- [Docker 安装](../installation/docker.mdx)
- [create-nocobase-app 安装](../installation/create-nocobase-app.mdx)

### 升级应用

- [Docker 安装的升级](../installation/docker.mdx)
- [create-nocobase-app 安装的升级](../installation/create-nocobase-app.mdx)

### 第三方插件的安装与升级

- [安装与升级插件](../install-upgrade-plugins.mdx)

## 静态资源代理

在生产环境中，建议将静态资源交由代理服务器管理，例如：

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## 常用运维命令

根据不同的安装方式，可以使用以下命令管理 NocoBase 进程：

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
