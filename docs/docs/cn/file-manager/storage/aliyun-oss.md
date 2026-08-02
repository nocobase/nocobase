---
pkg: '@nocobase/plugin-file-manager'
title: "存储引擎：阿里云 OSS"
description: "NocoBase 内置阿里云 OSS 存储引擎配置：区域、AccessKey、存储桶、超时时间，适用于阿里云对象存储。"
keywords: "阿里云 OSS,阿里云存储,AccessKey,存储桶,对象存储,OSS 配置,NocoBase"
---

# 存储引擎：阿里云 OSS

基于阿里云 OSS 的存储引擎，使用前需要准备相关账号和权限。

:::warning 注意

该引擎不支持私有访问。文件上传后，NocoBase 会生成可直接访问的 URL，任何获得该 URL 的用户都可以访问文件。

即使 OSS bucket 本身配置为私有，NocoBase 内置的阿里云 OSS 引擎也不会为文件访问生成临时签名 URL。如果需要私有访问，请使用支持签名 URL 的 [S3 Pro](./s3-pro) 存储引擎。已有历史文件时，可参考[迁移到 S3 Pro](./migrate-to-s3-pro.md)。

:::

## 配置参数

![阿里云 OSS 存储引擎配置示例](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=提示}
仅介绍阿里云 OSS 存储引擎的专用参数，通用参数请参考[引擎通用参数](./index#引擎通用参数)。
:::

### 区域

填写 OSS 存储的区域，例如：`oss-cn-hangzhou`。

:::info{title=提示}
可以在[阿里云 OSS 控制台](https://oss.console.aliyun.com/)中查看存储空间的区域信息，且只需截取区域前缀部分即可（无需完整域名）。
:::

### AccessKey ID

填写阿里云授权访问密钥的 ID。

### AccessKey Secret

填写阿里云授权访问密钥的 Secret。

### 存储桶

填写 OSS 存储的存储桶名称。

### 超时时间

填写上传到阿里云 OSS 的超时时间，单位为毫秒，默认为 `60000` 毫秒（即 60 秒）。
