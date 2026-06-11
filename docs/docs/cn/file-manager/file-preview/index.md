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

* [Office 文件预览插件](../file-preview/ms-office.md)

## 外部存储的 PDF 预览

PDF 文件预览使用 PDF.js 在浏览器中渲染。浏览器需要先读取 PDF 文件内容，再交给 PDF.js 渲染，因此当文件保存在 OSS、S3、COS、CDN 等外部存储，且文件访问域名与 NocoBase 站点域名不一致时，外部存储需要允许 NocoBase 站点跨域读取文件。

如果未配置 CORS，PDF 文件下载仍可正常使用，但预览可能会提示文件加载失败。

外部存储或 CDN 的 CORS 配置建议包含：

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

其中 `Access-Control-Allow-Origin` 应配置为实际访问 NocoBase 的站点域名。不建议对非公开文件长期使用 `*`，以免扩大文件读取范围。
