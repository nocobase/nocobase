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

NocoBase 使用浏览器 iframe 预览 PDF。部分浏览器或 PDF 阅读器可能支持 PDF 内的脚本、表单等交互内容。如果预览的是不可信来源的文件，需要关注脚本执行的安全边界。

推荐将文件访问域名与 NocoBase 站点和 API 域名隔离。比如将 OSS、S3、COS、CDN 文件放在独立域名下，不和 NocoBase 前端或 API 使用同一个 origin。

如果文件域名与 API 域名不同，且 API 没有向文件域名开放 CORS，那么即使 PDF 预览环境中存在脚本执行，脚本通常也会受浏览器同源策略限制，无法直接读取 NocoBase 页面内容、浏览器存储或 API 响应。
