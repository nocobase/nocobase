---
pkg: '@nocobase/plugin-file-manager'
title: "文件预览"
description: "文件字段支持点击缩略图预览，内置图片、PDF、视频等浏览器原生格式，可扩展 Office 等插件实现 Word/Excel/PPT 预览。"
keywords: "文件预览,Preview,缩略图,Office 预览,PDF 预览,图片预览,NocoBase"
---

# 文件预览

在包含文件字段（含附件字段）的界面中，可以通过点击文件缩略图或图标来预览文件。内置预览功能支持多种文件类型，包括图片、PDF 和大部分浏览器原生支持的文件类型。

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

对于不支持原生预览的文件类型，可以通过安装或扩展相应的文件预览插件来实现预览功能。例如，安装 Office 文件预览插件后，即可预览 Word、Excel 和 PowerPoint 文件。

目前 NocoBase 提供的文件预览插件：

- [Office 文件预览插件](./ms-office.md)

## PDF 预览机制

NocoBase 会根据 PDF 文件 URL 是否与当前页面同源，选择不同的预览方式：

| 文件 URL | 常见存储方式 | 预览方式 | 对 CORS 的要求 |
| --- | --- | --- | --- |
| 与 NocoBase 同源 | 本地存储 | NocoBase 读取文件内容，并使用内置 PDF.js 渲染 | 不涉及跨域 CORS |
| 与 NocoBase 跨域 | OSS、S3、COS、CDN 等第三方存储 | 浏览器通过 iframe 打开文件 URL | iframe 预览本身不要求 CORS |

:::tip 判断依据

预览方式由文件 URL 是否同源决定，并不直接取决于存储引擎名称。如果本地存储使用了独立文件域名，会按跨域地址处理；如果第三方存储通过 NocoBase 同源代理访问，则会按同源地址处理。

:::

### 本地存储或同源地址

本地存储生成的 URL 通常以 `/storage/uploads/` 开头，跟 NocoBase 页面同源。预览时，NocoBase 会读取 PDF 文件内容，再交给内置 PDF.js 渲染页面和文本。

这种方式不依赖浏览器自带的 PDF 阅读器。即使文件响应为了安全设置了 `Content-Disposition: attachment`，NocoBase 仍可读取文件内容并在预览组件中渲染。不过文件 URL 必须允许当前登录状态正常访问。

### 第三方存储或跨域地址

OSS、S3、COS 和 CDN 等第三方存储通常使用独立域名。NocoBase 会将这类 PDF URL 放入 iframe，由浏览器和存储服务的响应头决定显示结果。

要在 iframe 中正常打开 PDF，存储服务通常需要返回 `Content-Type: application/pdf`，并且不能通过 `Content-Disposition: attachment` 强制下载。如果响应头要求下载，浏览器会直接下载文件，NocoBase 无法在前端覆盖这个行为。

iframe 加载跨域 PDF 本身不需要 CORS。不过，预览组件的下载按钮会通过 `fetch` 读取文件并生成 Blob，因此跨域下载仍需要存储服务允许 NocoBase 站点的 CORS 请求。

### 阿里云 OSS 的注意事项

阿里云 OSS 的默认域名在部分场景下会通过 `Content-Disposition: attachment` 和 `x-oss-force-download: true` 强制下载文件。此时图片等文件可能仍可预览，但 PDF 放入 iframe 后会变成下载。

通常可以为 bucket 绑定自定义域名，并让 NocoBase 使用该域名访问文件。具体配置和排查方法见[阿里云 OSS 常见问题](../storage/aliyun-oss.md#常见问题)。

### 跨域预览的安全边界

部分浏览器或 PDF 阅读器可能支持 PDF 内的脚本、表单等交互内容。如果预览的是不可信来源的文件，需要关注脚本执行的安全边界。

推荐将文件访问域名与 NocoBase 站点和 API 域名隔离。比如将 OSS、S3、COS、CDN 文件放在独立域名下，不和 NocoBase 前端或 API 使用同一个 origin。

如果文件域名与 API 域名不同，且 API 没有向文件域名开放 CORS，那么即使 PDF 预览环境中存在脚本执行，脚本通常也会受浏览器同源策略限制，无法直接读取 NocoBase 页面内容、浏览器存储或 API 响应。

## 相关链接

- [Office 文件预览插件](./ms-office.md)
- [阿里云 OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
