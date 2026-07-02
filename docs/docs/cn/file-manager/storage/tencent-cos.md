---
pkg: '@nocobase/plugin-file-manager'
title: "存储引擎：腾讯云 COS"
description: "NocoBase 内置腾讯云 COS 存储引擎配置：区域、SecretId、SecretKey、存储桶，适用于腾讯云对象存储。"
keywords: "腾讯云 COS,腾讯云存储,SecretId,SecretKey,存储桶,对象存储,NocoBase"
---

# 腾讯云 COS

基于腾讯云 COS 的存储引擎，使用前需要准备相关账号和权限。

:::warning 注意

该引擎不支持私有访问。文件上传后，NocoBase 会生成可直接访问的 URL，任何获得该 URL 的用户都可以访问文件。

即使 COS bucket 本身配置为私有，NocoBase 内置的腾讯云 COS 引擎也不会为文件访问生成临时签名 URL。如果需要私有访问，请使用支持签名 URL 的 [S3 Pro](./s3-pro) 存储引擎。已有历史文件时，可参考[迁移到 S3 Pro](./migrate-to-s3-pro.md)。

:::

## 配置参数

![腾讯 COS 存储引擎配置示例](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=提示}
仅介绍腾讯云 COS 存储引擎的专用参数，通用参数请参考[引擎通用参数](./index.md#引擎通用参数)。
:::

### 区域

填写 COS 存储的区域，例如：`ap-chengdu`。

:::info{title=提示}
可以在[腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)中查看存储空间的区域信息，且只需截取区域前缀部分即可（无需完整域名）。
:::

### SecretId

填写腾讯云授权访问密钥的 ID。

### SecretKey

填写腾讯云授权访问密钥的 Secret。

### 存储桶

填写 COS 存储的存储桶名称，例如：`qing-cdn-1234189398`。
