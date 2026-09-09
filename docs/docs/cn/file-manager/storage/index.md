---
pkg: '@nocobase/plugin-file-manager'
title: "存储引擎概述"
description: "存储引擎将文件保存至本地或云存储，支持本地、Amazon S3、阿里云 OSS、腾讯云 COS、S3 Pro，配置路径、访问 URL、大小限制、MIME 类型等。"
keywords: "存储引擎,Storage,本地存储,S3,OSS,COS,文件大小限制,MIME 类型,NocoBase"
---

# 概述

## 介绍

存储引擎用于将文件保存到特定的服务中，包括本地存储（保存到服务器硬盘）、云存储等。

使用任何上传文件之前，都需要先配置存储引擎。系统安装时会自动添加一个本地存储引擎，可直接使用。也可以添加新的或编辑已有的引擎参数。

## 存储引擎类型

目前 NocoBase 内置支持的引擎类型如下：

- [本地存储](./local)
- [Amazon S3](./amazon-s3)
- [阿里云 OSS](./aliyun-oss)
- [腾讯云 COS](./tencent-cos)
- [S3 Pro](./s3-pro)

系统安装时会自动添加一个本地存储引擎，可直接使用。也可以添加新的或编辑已有的引擎参数。

## 通用参数

除了不同引擎类别的特有参数外，以下部分为通用参数（以本地存储为例）：

![文件存储引擎配置示例](https://static-docs.nocobase.com/20240529115151.png)

### 标题

存储引擎的名称，用于人工识别。

### 系统名

存储引擎的系统名称，用于系统识别。必须是系统唯一的，不填会由系统自动随机生成。

### 访问 URL 前缀

该文件对外可访问的 URL 地址前缀部分，可以是 CDN 的访问 URL 基础，如：“`https://cdn.nocobase.com/app`”（无需结尾的“`/`”）。

### 路径

存储文件时使用的相对路径，在访问时此部分也会被自动拼接到最终的 URL 中。如：“`user/avatar`”（无需开头和结尾的“`/`”）。

### 文件大小限制

对此存储引擎上传文件时的大小限制，超过该设置大小的文件将无法上传。系统默认限制为 20MB，可调整到最大的限制为 1GB。

### 文件类型

可对上传文件的类型进行限制，使用 [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) 语法描述格式。例如：`image/*` 代表图片类文件。多个类型可以用英文逗号分隔，如：`image/*, application/pdf` 代表允许图片类型和 PDF 类型的文件。

### 默认存储引擎

勾选后设置为系统的默认存储引擎，在附件字段或文件表未指定存储引擎时，上传的文件均会保存至默认存储引擎中。默认存储引擎不可删除。

### 删除记录时保留文件

勾选后当附件表或文件表的数据记录被删除时，仍然保留存储引擎中已上传的文件。默认不勾选，即删除记录时会同时删除存储引擎中的文件。

:::info{title=提示}
选择原始 URL 时，最终的存储地址会由几部分拼接而成：

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

比如：`https://cdn.nocobase.com/app/user/avatar/20240529115151.png`。

选择 NocoBase URL 时，文件记录会返回 `/files/...` 格式的 NocoBase 路径，访问存储服务时仍会使用以上配置。
:::

## 文件 URL 与访问控制

存储引擎可以返回 NocoBase URL 或存储服务的原始 URL。默认使用 NocoBase URL，只有当外部服务必须直接使用存储地址时，才需要选择原始 URL。

这项配置按存储引擎生效。保存后，该引擎下已有文件和新上传文件都会按所选方式返回 URL，不会移动或重新上传文件。

![20260723221234](https://static-docs.nocobase.com/20260723221234.png)

### NocoBase URL

文件记录返回 NocoBase 提供的访问路径，比如：

```text
/files/main/main/attachments/1.png
```

访问该 URL 时，请求会先经过 NocoBase，并遵循对应文件记录配置的查看权限。权限检查通过后，NocoBase 才会读取文件或跳转到存储服务生成的地址。

这是默认推荐的方式。文件记录中返回的是 NocoBase 路径，调用方不需要了解当前使用的是本地存储还是云存储。

### 原始 URL

文件记录直接返回存储服务生成的地址，比如：

```text
https://storage.example.com/path/to/file.png
```

该 URL 不检查文件记录的查看权限。对于本地存储，它通常是 `/storage/uploads/` 历史地址，默认要求用户登录，但不会继续检查具体文件记录的权限；对于云存储，它通常是对象存储或 CDN 地址，其访问策略由对应存储服务决定。

只有当调用方无法使用 NocoBase URL——比如不能跟随 `302` 重定向，或明确需要对象存储 / CDN 地址时，才建议选择原始 URL。

:::warning 注意

选择原始 URL 后，获得有效 URL 的用户可以绕过 NocoBase 的文件记录权限。对于本地存储，历史地址仍受 `/storage/uploads/` 登录检查约束；如果通过自定义 Nginx 直接暴露上传目录，则可能绕过该检查。对于云存储，如果地址没有签名和有效期，还需要确保存储桶及文件允许公开读取。

:::

### 允许公开访问

「允许公开访问」只会在选择「NocoBase URL」时有效。勾选后仍然返回 NocoBase URL，不过访问时不再检查 NocoBase 中的文件记录权限——任何获得该 URL 的用户都可以访问文件。

这个选项不会修改存储服务自身的公开读取配置。它只控制请求经过 NocoBase 时是否检查文件记录权限。

Markdown、外部页面或第三方服务也可以使用公开的 NocoBase URL。外部使用时，需要将接口返回的路径补全为包含 NocoBase 域名的绝对 URL，并确保调用方支持跟随 `302` 重定向。

:::warning 本地存储说明

本地存储的 NocoBase URL 最终会重定向到 `/storage/uploads/`。勾选「允许公开访问」只会跳过 `/files/` 阶段的文件记录权限，历史地址默认仍要求登录。如果确实需要匿名读取本地文件，还需设置 `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` 并重启应用。该环境变量会公开整个 `/storage/uploads/` 历史路径，而不只是当前勾选公开访问的存储，启用前请评估已有文件。

使用自定义 Nginx 时，还需要为 `/storage/uploads/` 配置 `auth_request`。完整配置见 [Nginx 反向代理](../../nocobase-cli/production/reverse-proxy/nginx.md)。

:::

### 如何选择

| 使用场景 | 文件 URL | 允许公开访问 |
| --- | --- | --- |
| 文件需要遵循角色和数据权限 | NocoBase URL | 不勾选 |
| Markdown、外部页面或第三方服务需要公开读取文件 | NocoBase URL | 勾选 |
| 调用方不能跟随 `302` 重定向，或必须直接使用存储地址 | 原始 URL | 不适用 |

:::warning 注意

[本地存储](./local)、[Amazon S3](./amazon-s3)、[阿里云 OSS](./aliyun-oss) 和 [腾讯云 COS](./tencent-cos) 不会生成临时签名 URL。即使选择 NocoBase URL 并启用文件记录权限，已经获得存储服务原始地址的用户也可以绕过文件记录权限。其中，本地存储的历史地址默认仍要求登录；云存储原始地址的访问能力取决于对应服务的公开读取配置。

如果需要保存合同、证件、内部资料等不应公开的文件，建议使用 [S3 Pro](./s3-pro)，并参考其专属的访问控制配置。

:::

如果你已经在使用公开存储引擎，并希望把历史文件迁移到 S3 Pro，可参考 [迁移到 S3 Pro](./migrate-to-s3-pro.md)。
