---
pkg: '@nocobase/plugin-file-manager'
title: "存储引擎：Amazon S3"
description: "NocoBase 内置 Amazon S3 存储引擎配置：区域、AccessKey ID/Secret、存储桶名称，适用于 AWS 云存储。"
keywords: "Amazon S3,AWS,存储桶,AccessKey,云存储,S3 配置,NocoBase"
---

# 存储引擎：Amazon S3

基于 Amazon S3 的存储引擎，使用前需要准备相关账号和权限。

:::warning 注意

该引擎不支持私有访问。文件上传后，NocoBase 会生成可直接访问的 URL，任何获得该 URL 的用户都可以访问文件。

即使 S3 bucket 本身配置为私有，NocoBase 内置的 Amazon S3 引擎也不会为文件访问生成临时签名 URL。如果需要私有访问，请使用支持签名 URL 的 [S3 Pro](./s3-pro) 存储引擎。已有历史文件时，可参考[迁移到 S3 Pro](./migrate-to-s3-pro.md)。

:::

## 配置参数

![Amazon S3 存储引擎配置示例](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=提示}
仅介绍 Amazon S3 存储引擎的专用参数，通用参数请参考[引擎通用参数](./index#引擎通用参数)。
:::

### 区域

填写 S3 存储的区域，例如：`us-west-1`。

:::info{title=提示}
可以在[Amazon S3 控制台](https://console.aws.amazon.com/s3/)中查看存储空间的区域信息，且只需截取区域前缀部分即可（无需完整域名）。
:::

### AccessKey ID

填写 Amazon S3 授权访问密钥的 ID。

### AccessKey Secret

填写 Amazon S3 授权访问密钥的 Secret。

### 存储桶

填写 S3 存储的存储桶名称。
