---
pkg: '@nocobase/plugin-file-manager'
title: "存储引擎：本地存储"
description: "本地存储将文件保存至服务器硬盘，适用于小规模或试验场景，配置路径、访问 URL、大小限制等参数。"
keywords: "本地存储,Local Storage,服务器硬盘,存储路径,文件存储,NocoBase"
---

# 存储引擎：本地存储

上传文件将保存在服务器本地硬盘目录中，适用于系统管理的上传文件总量较少或试验性的场景。

:::warning 注意

本地存储不支持私有访问。文件上传后，NocoBase 会生成可直接访问的 URL，任何获得该 URL 的用户都可以访问文件。

如果需要保存合同、证件、内部资料等不应公开的文件，请使用支持私有访问的 [S3 Pro](./s3-pro) 存储引擎。已有历史文件时，可参考[迁移到 S3 Pro](./migrate-to-s3-pro.md)。

如果你没有使用 Docker 或官方 nginx 配置，而是通过自定义 proxy 访问本地上传文件，请确认 `/storage/uploads/` 路径配置了 `X-Content-Type-Options: nosniff`，并让 `html`、`svg`、`xhtml`、`pdf` 等主动内容文件以附件方式下载。详细说明见[安全指南：文件存储](../../security/guide.md#文件存储)。

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
