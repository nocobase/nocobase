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

即使 OSS bucket 本身配置为私有，NocoBase 内置的阿里云 OSS 引擎也不会为文件访问生成临时签名 URL。如果需要私有访问，请使用支持签名 URL 的 [S3 Pro](./s3-pro.md) 存储引擎。已有历史文件时，可参考[迁移到 S3 Pro](./migrate-to-s3-pro.md)。

:::

## 配置参数

![阿里云 OSS 存储引擎配置示例](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=提示}
仅介绍阿里云 OSS 存储引擎的专用参数，通用参数请参考[引擎通用参数](./index.md#通用参数)。
:::

### 基础 URL

填写文件访问地址的前缀，比如绑定到当前 bucket 的自定义域名 `https://oss.example.com`。如果使用阿里云 OSS 默认域名访问 PDF，可能遇到浏览器强制下载的问题，建议先绑定自定义域名。详细说明见下方的[常见问题](#常见问题)。

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

## 常见问题

### PDF 预览时变成下载

NocoBase 对跨域 PDF 使用 iframe 预览。此时，浏览器会直接访问 OSS 文件 URL，最终是预览还是下载由 OSS 返回的响应头决定。

如果 PDF 在 iframe 中变成下载，可以在浏览器开发者工具的「网络」面板检查文件请求。常见的异常响应头如下：

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` 表示文件类型正确，不过 `Content-Disposition: attachment` 会要求浏览器下载文件。阿里云 OSS 默认域名在部分场景下会强制下载，详细说明见阿里云官方文档：[如何配置访问 PDF 文件时是预览行为](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded)。

推荐按以下方式配置：

1. 按照[通过自定义域名访问 OSS 资源](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names)为 bucket 绑定自定义域名
2. 将域名解析和 HTTPS 证书配置完成，确认自定义域名能直接访问文件
3. 根据使用的 NocoBase 存储引擎填写访问地址

其中，第 3 步有两种情况：

- 使用内置「阿里云 OSS」存储引擎时，将「基础 URL」设置为绑定后的自定义域名，比如 `https://oss.example.com`
- 使用 [S3 Pro](./s3-pro.md) 连接阿里云 OSS 时，上传 endpoint 可以继续使用 OSS 区域 endpoint；将访问 endpoint 设置为自定义域名，并将 `Full access URL style` 设置为 `Ignore`

配置后重新上传一个 PDF 进行验证。已有文件记录中如果保存了完整 URL，还需要确认实际返回给前端的 URL 已经切换到自定义域名。

:::tip 判断响应头

iframe 预览跨域 PDF 本身不要求 CORS。PDF 能否内嵌显示，主要取决于 `Content-Type` 和 `Content-Disposition`，这与下方下载按钮需要的 CORS 是两个不同的问题。

:::

### 图片能预览，但点击下载提示 CORS 错误

图片预览通常通过 `<img>` 加载，PDF 跨域预览通过 iframe 加载，这两种方式都可以在没有 CORS 响应头时显示资源。不过预览组件的下载按钮需要通过 `fetch` 读取文件，再生成 Blob 交给浏览器下载。这个请求受浏览器同源策略限制。

如果控制台出现以下错误，说明 OSS 没有针对当前 NocoBase 站点返回 `Access-Control-Allow-Origin`：

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

按照阿里云官方文档[配置跨域资源共享](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing)，为 bucket 新建 CORS 规则。用于预览组件下载时，可以按以下内容配置：

| 配置项 | 建议值 |
| --- | --- |
| 来源（Allowed Origins） | NocoBase 的完整 origin，比如 `https://example.com` |
| 允许的方法（Allowed Methods） | `GET`、`HEAD` |
| 允许的请求头（Allowed Headers） | `*` |
| 暴露的响应头（Expose Headers） | `ETag`、`Content-Disposition` |
| 缓存时间（MaxAgeSeconds） | `600` |

如果 S3 Pro 还需要浏览器直传文件，请根据浏览器「网络」面板中的实际上传请求，把 `PUT`、`POST` 等方法加入同一规则，或单独创建上传规则。

配置保存后，使用 NocoBase 站点的 origin 重新请求文件。预期响应至少包含：

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

浏览器可能已经缓存了图片预览时取得的响应。该响应没有携带 `Origin` 请求头，也可能没有 `Access-Control-Allow-Origin` 响应头。如果配置 CORS 后下载仍然失败，可以先清除该文件的浏览器缓存，或在开发者工具中勾选「停用缓存」后重试。

### 如何验证响应头

可以用 `curl` 模拟从 NocoBase 站点发起的跨域请求。把示例 origin、文件地址和签名参数替换为实际值：

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

检查结果时，分别确认：

- PDF 预览返回 `Content-Type: application/pdf`，且没有 `Content-Disposition: attachment`
- 跨域下载返回与 NocoBase 站点匹配的 `Access-Control-Allow-Origin`
- 实际文件 URL 使用自定义域名，而不是 `*.oss-cn-*.aliyuncs.com` 默认域名

如果不带 `Origin` 的请求没有返回 CORS 响应头，这是正常现象。验证 CORS 时必须保留示例中的 `Origin` 请求头。

## 相关链接

- [文件预览](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [迁移到 S3 Pro](./migrate-to-s3-pro.md)
- [存储引擎](./index.md)
