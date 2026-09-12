---
pkg: '@nocobase/plugin-file-manager'
title: "存储引擎：本地存储"
description: "本地存储将文件保存至服务器硬盘，适用于小规模或试验场景，配置路径、访问 URL、大小限制等参数。"
keywords: "本地存储,Local Storage,服务器硬盘,存储路径,文件存储,NocoBase"
---

# 存储引擎：本地存储

上传文件将保存在服务器本地硬盘目录中，适用于系统管理的上传文件总量较少或试验性的场景。

:::warning 注意

推荐通过 `/files/` 稳定 URL 访问本地文件，由 NocoBase 检查文件记录和当前角色的查看权限。历史 `/storage/uploads/` 地址不具备文件记录级权限，但在 Docker、内置 Nginx 和 NocoBase CLI 生成的 Nginx 配置中，默认仅允许已登录用户访问。

如果需要保存合同、证件、内部资料等不应公开的文件，请使用支持私有访问的 [S3 Pro](./s3-pro) 存储引擎。已有历史文件时，可参考[迁移到 S3 Pro](./migrate-to-s3-pro.md)。

如果你使用自定义 Nginx 通过 `alias` 返回本地上传文件，必须在 `/storage/uploads/` location 中使用 `auth_request` 调用 NocoBase 的认证接口，否则会绕过默认的登录检查。同时应配置 `X-Content-Type-Options: nosniff`，并让 `html`、`svg`、`xhtml`、`pdf` 等主动内容文件以附件方式下载。完整示例和子应用配置方式见 [Nginx 反向代理](../../nocobase-cli/production/reverse-proxy/nginx.md)，相关风险说明见[安全指南：文件存储](../../security/guide.md#文件存储)。

如果已有集成依赖历史地址的匿名访问，可以设置 `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` 并重启应用。该兼容开关只影响 `/storage/uploads/`，不会改变 `/files/` 的文件记录级权限。

:::

## 配置参数

![文件存储引擎配置示例](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=提示}
仅介绍本地存储引擎的专用参数，通用参数请参考[引擎通用参数](./index.md#引擎通用参数)。
:::

### 路径

同时表达文件存储在服务器上的相对路径和 URL 访问路径。如：“`user/avatar`”（无需开头和结尾的“`/`”），代表了：

1. 上传文件时存储在服务器上的相对路径：`/path/to/nocobase-app/storage/uploads/user/avatar`。
2. 访问时的 URL 地址前缀：`http://localhost:13000/storage/uploads/user/avatar`。
